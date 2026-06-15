# Nature Palette — Folder Structure

**Version:** 0.1  
**Status:** Draft — awaiting approval

---

## 1. Project Root

```
nature-palette/
├── docs/                          # Architecture & product docs (this folder)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│       ├── birds.json             # Bird metadata seed file
│       └── images/                # Source images for ingestion
├── public/
│   └── birds/                     # Processed/optimized bird images
├── scripts/
│   ├── ingest-bird.ts             # Single bird color extraction
│   ├── ingest-all.ts              # Batch ingest all seed birds
│   └── compute-similarity.ts      # Batch similar bird computation
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
├── .env.example
├── .gitignore
├── components.json                # shadcn config
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Source Directory Detail

```
src/
├── app/
│   ├── globals.css                # Tailwind base + CSS variables
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home
│   ├── not-found.tsx
│   └── birds/
│       └── [slug]/
│           └── page.tsx           # Bird detail
│
├── components/
│   ├── ui/                        # shadcn/ui primitives (auto-generated)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   └── sonner.tsx
│   │
│   ├── layout/
│   │   ├── site-header.tsx
│   │   └── section-heading.tsx
│   │
│   ├── home/
│   │   ├── home-client.tsx        # Client wrapper for search state
│   │   ├── search-input.tsx
│   │   ├── bird-grid.tsx
│   │   └── bird-thumbnail.tsx
│   │
│   └── bird/
│       ├── bird-hero.tsx
│       ├── bird-metadata.tsx
│       ├── color-system-section.tsx
│       ├── color-chip.tsx
│       ├── dominant-colors.tsx
│       ├── rule-recommendation.tsx
│       ├── accessibility-section.tsx
│       ├── accessibility-row.tsx
│       ├── wcag-indicator.tsx
│       ├── component-preview-section.tsx
│       ├── theme-preview.tsx
│       ├── preview-navigation.tsx
│       ├── preview-buttons.tsx
│       ├── preview-input.tsx
│       ├── preview-card.tsx
│       ├── preview-badge.tsx
│       ├── preview-alert.tsx
│       └── similar-birds-section.tsx
│
├── lib/
│   ├── db.ts                        # Prisma client singleton
│   ├── utils.ts                     # cn() helper
│   │
│   ├── data/
│   │   ├── birds.ts                 # getBirds(), getBirdBySlug()
│   │   └── types.ts                 # Query return types
│   │
│   └── color/
│       ├── extract.ts               # Main extraction orchestrator
│       ├── quantize.ts              # Median cut / color quantization
│       ├── deduplicate.ts           # ΔE-based merge
│       ├── dominance.ts             # Pixel percentage calculation
│       ├── accessibility.ts         # WCAG contrast calculations
│       ├── similarity.ts            # Palette similarity scoring
│       ├── theme.ts                 # buildBirdTheme() for preview
│       └── constants.ts             # ΔE threshold, max colors, etc.
│
└── types/
    ├── bird.ts                      # Bird, BirdSummary, BirdWithPalette
    └── color.ts                     # PaletteColor, AccessibilityResult, BirdTheme
```

---

## 3. File Naming Conventions

| Rule | Example |
|------|---------|
| Components: kebab-case files, PascalCase exports | `color-chip.tsx` → `ColorChip` |
| Utilities: camelCase files | `accessibility.ts` → `calculateContrast()` |
| Pages: Next.js convention | `page.tsx`, `layout.tsx` |
| Types: singular nouns | `bird.ts`, not `birds.ts` |
| Scripts: kebab-case | `ingest-all.ts` |

---

## 4. Import Aliases

```json
// tsconfig.json paths
{
  "@/*": ["./src/*"]
}
```

Usage:
```typescript
import { getBirds } from '@/lib/data/birds'
import { ColorChip } from '@/components/bird/color-chip'
import type { BirdWithPalette } from '@/types/bird'
```

---

## 5. shadcn/ui Setup

Install only what the preview section needs:

```bash
npx shadcn@latest init
npx shadcn@latest add button input card badge alert sonner
```

Components land in `src/components/ui/`. Do not modify shadcn primitives except via CSS variables — theme preview overrides variables at the wrapper level.

---

## 6. Environment Variables

```bash
# .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/nature_palette"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

No API keys required — color extraction is fully local.

---

## 7. Key Dependencies

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@prisma/client": "^6",
    "culori": "^4",
    "sharp": "^0.33",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "sonner": "^1"
  },
  "devDependencies": {
    "prisma": "^6",
    "typescript": "^5",
    "tailwindcss": "^4",
    "@types/node": "^22",
    "@types/react": "^19"
  }
}
```

---

## 8. What Lives Where — Decision Guide

| Question | Location |
|----------|----------|
| Page-level data fetching | `src/app/*/page.tsx` |
| Reusable query functions | `src/lib/data/` |
| Color math / extraction | `src/lib/color/` |
| UI components | `src/components/` |
| shadcn primitives | `src/components/ui/` |
| Shared TypeScript types | `src/types/` |
| One-off batch jobs | `scripts/` |
| Seed data | `prisma/seed/` |
| Processed images | `public/birds/` |
| Architecture docs | `docs/` |

---

## 9. Git Ignore Essentials

```
node_modules/
.next/
.env
public/birds/          # optional — may commit optimized images
prisma/seed/images/    # keep source images out of repo if large
```

---

*Next document: [Implementation Roadmap](./implementation-roadmap.md)*
