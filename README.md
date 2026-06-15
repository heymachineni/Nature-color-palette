# Nature Palette

A visual discovery tool for exploring color systems perfected by nature. Every bird becomes a living design system — raw palettes, curated roles, design tokens, and accessibility pairings.

**Live:** [nature-colorpalette.web.app](https://nature-colorpalette.web.app)

## Stack

- Next.js 15 · TypeScript · Tailwind · shadcn/ui
- Firestore (bird data) · images in `public/birds/`
- Color pipeline: extract → interpret → tokens → designer modes

## Local development

```bash
npm install
npm run dev
```

Uses Firestore when `.env` is configured. Force local JSON:

```bash
USE_JSON_DATA=true npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run ingest` | Fetch birds from Wikipedia + extract colors |
| `npm run refresh-colors` | Re-extract colors from cached cutouts |
| `npm run audit-colors` | QA palette quality across all birds |
| `npm run seed:firestore` | Upload `dataset.json` → Firestore |

## Environment

Copy `.env.example` → `.env`. Add your Firebase service account JSON path (gitignored):

```
FIREBASE_SERVICE_ACCOUNT_PATH="your-firebase-adminsdk.json"
NEXT_PUBLIC_APP_URL="https://nature-colorpalette.web.app"
```

Never commit `.env` or `*-firebase-adminsdk-*.json`.

## Firestore structure

Collection: `birds` — one document per bird (slug as document ID), same shape as `prisma/seed/dataset.json`.
