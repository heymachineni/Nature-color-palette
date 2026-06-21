# Bird Palette

**Live:** [birdpalette.web.app](https://birdpalette.web.app)

Bird Palette is a visual catalog of real bird plumage colors. Every species is a color combination pulled from nature: browse birds, search by name or exact hex, open a palette, and copy swatches.

Built for exploration and inspiration, not as a generic palette generator.

---

## What it is

- **10,000+ birds** with palettes extracted from species photos
- Each bird has a **proportional color bar**, named swatches, share percentages, and a **copy-ready palette**
- **Search** by common name, scientific name, color family, or exact hex code
- **Modal detail view** with Wikipedia summary, palette study, hover-to-sample on the photo, and related birds
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
2. **Deploy time** — `npm run build:hosting` static-exports the site (home grid, `/perch`, `/privacy`, `/terms`, 404) into `out/`. Bird detail opens in a modal — there are no per-slug HTML pages.
3. **Runtime** — the live site is mostly static. Bird photos, Wikipedia blurbs, and photo pixel sampling use your browser plus a small Cloud Function proxy (`/api/photo-sample`) for canvas reads.

---

## What we built

| Area | Detail |
|------|--------|
| **Data pipeline** | Photo color extraction, BirdNET + iNaturalist photos, birds without photos excluded |
| **Search** | Text + color-family tokens; exact hex match via picker or `#RRGGBB` |
| **Bird detail** | Modal-first UX, draggable palette bar on mobile (haptic on Android; best-effort on iOS), hover/hold photo to sample pixels |
| **Info pages** | `/perch` (about), `/privacy`, `/terms` |
| **Hosting** | GitHub Actions → Firebase (`birdpalette` project) |

---

## Scaling to ~10,000 birds

**Current approach (static JSON, not Firestore in production):**

| | Pros | Cons |
|---|------|------|
| **Paginated pages + search index** (what we use now) | Fast grid after first page, works on CDN, no server cost, matches privacy policy | Search index is ~18 MB on first filter; build/deploy time grows with dataset |
| **Firestore at runtime** | Could paginate and load birds on demand; smaller initial payload | Needs Firebase reads (cost + latency), client SDK, network on every browse; more moving parts |

**Recommendation:** stay on static JSON for the public site. If search feels slow, slim the search index (lighter fields) before moving to Firestore.

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
