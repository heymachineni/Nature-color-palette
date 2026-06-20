# Bird Palette

**Live:** [birdpalette.web.app](https://birdpalette.web.app)

Bird Palette is a visual catalog of real bird plumage colors. Every species is a color combination pulled from nature: browse birds, search by name or exact hex, open a palette, copy swatches or CSS, and preview how those colors feel on UI.

Built for exploration and inspiration, not as a generic palette generator.

---

## What it is

- **10,000+ birds** with palettes extracted from species photos
- Each bird has a **proportional color bar**, named swatches, share percentages, and a **copy-ready palette**
- **Search** by common name, scientific name, color family, or exact hex code
- **Modal detail view** with Wikipedia summary, palette study, and an “In use” MUI dashboard preview
- Photos from **BirdNET** and **iNaturalist**; colors extracted from each photo at build time

Not for commercial use. Educational and exploratory. See [/perch](https://birdpalette.web.app/perch) for the story and data credits.

---

## How it works

```
BirdNET / iNaturalist  →  photo resolver  →  image per species
        ↓
  bg removal + pixel scan  →  palette per photo
        ↓
  dataset.json + paginated public/data/
        ↓
  Static Next.js export  →  Firebase Hosting
```

1. **Build time** — `npm run build:birds` fetches photos, removes backgrounds, extracts plumage colors, computes similar palettes, and writes `prisma/seed/dataset.json` plus `public/data/`.
2. **Deploy time** — `npm run build:hosting` static-exports the site (home grid, ~2k bird pages, `/perch`, `/privacy`) into `out/`.
3. **Runtime** — the live site is fully static. No backend, no accounts, no analytics. Bird photos and Wikipedia blurbs are fetched **from your browser** directly to BirdNET, iNaturalist, and Wikipedia when you open a bird.

---

## What we built

| Area | Detail |
|------|--------|
| **Data pipeline** | Photo color extraction, BirdNET + iNaturalist photos, birds without photos excluded |
| **Search** | Text + color-family tokens; exact hex match via picker or `#RRGGBB` |
| **Bird detail** | Modal-first UX, draggable palette bar on mobile (haptic on Android; best-effort on iOS) |
| **In use** | MUI dashboard preview themed with the bird’s palette |
| **Info pages** | `/perch` (about), `/privacy` |
| **Hosting** | GitHub Actions → Firebase (`birdpalette` project) |

---

## Scaling to ~10,290 birds

**Current approach (static JSON, not Firestore in production):**

| | Pros | Cons |
|---|------|------|
| **Static `index.json` + export** (what we use now) | Fast after load, works offline on CDN, no server cost, matches privacy policy | Home page embeds the full search index at build time (~4 MB today; ~20 MB at 10k birds). First visit download grows; build/deploy time increases (~10k static HTML pages) |
| **Firestore at runtime** | Could paginate and load birds on demand; smaller initial payload | Needs Firebase reads (cost + latency), client SDK, network on every browse, conflicts with “we collect nothing” unless carefully scoped; more moving parts |

**Recommendation:** stay on static JSON for the public site. If 10k feels slow, split the index (e.g. lightweight list + fetch full palette on modal open) before moving to Firestore.

Firestore in this repo is **optional** for local/dev seeding only (`npm run seed:firestore`). Production hosting uses `USE_JSON_DATA=true`.

---

## Developer commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev (dataset.json) |
| `USE_JSON_DATA=true npm run dev` | Same data path as production |
| `npm run build:birds -- --limit 50` | Rebuild bird dataset + search index (smoke test) |
| `npm run build:birds` | Full photo-extraction rebuild (~10k birds, hours first run) |
| `npm run build:hosting` | Static export to `out/` |
| `npm run deploy:hosting` | Build + deploy to Firebase |

See [docs/DEPLOY.md](docs/DEPLOY.md) for CI and Firebase setup.

---

## Data sources

- [BirdNET](https://birdnet.cornell.edu/) — species photos
- [iNaturalist](https://www.inaturalist.org/) — species photos (fallback)
- [Wikipedia](https://www.wikipedia.org/) — bird descriptions (client-side)

---

## Contact

Questions or feedback: [heymachineni@gmail.com](mailto:heymachineni@gmail.com) · Built by [Chandu Machineni](https://chandumachineni.com/)
