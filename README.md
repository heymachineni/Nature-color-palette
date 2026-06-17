# Nature Palette

Copy real bird color combinations into your designs. Search by color or browse birds — see plumage palettes and preview them on UI components.

**Live:** [nature-colorpalette.web.app](https://nature-colorpalette.web.app)

## Stack

- Next.js 15 (static export) · TypeScript · Tailwind · shadcn/ui
- `dataset.json` + `public/data/index.json` (production) · Firestore (optional catalog DB)
- Images in `public/birds/` · GitHub Actions → Firebase Hosting

## Local development

```bash
npm install
npm run dev
```

Production data path (same as hosting):

```bash
USE_JSON_DATA=true npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build:hosting` | Static export for Firebase Hosting |
| `npm run deploy:hosting` | Build + deploy locally |
| `npm run ingest` | Kaggle or cached images → plumage colors → dataset |
| `npm run refresh-colors` | Re-extract plumage from existing cutouts |
| `npm run audit-colors` | QA expected color families |
| `npm run seed:firestore` | Upload `dataset.json` → Firestore |

### Kaggle images (optional)

Download [Birds 525 Species](https://www.kaggle.com/datasets/gpiosenka/100-bird-species), then:

```bash
KAGGLE_DATA_DIR="/path/to/100-bird-species" npm run ingest
```

Without `KAGGLE_DATA_DIR`, ingest uses existing `public/birds/*.webp`.

## Environment

Copy `.env.example` → `.env`:

```
FIREBASE_SERVICE_ACCOUNT_PATH="your-firebase-adminsdk.json"
NEXT_PUBLIC_APP_URL="https://nature-colorpalette.web.app"
```

## Data model (v2)

Each bird in `prisma/seed/dataset.json`:

- `colors[]` — plumage only (hex, family, share %)
- `colorFamilies[]` — for search
- `theme` — UI neutrals + primary/accent (not shown as bird colors)
- `similar[]` — palette-matched birds

Firestore collection `birds` uses the same document shape.
