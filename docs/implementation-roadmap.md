# Nature Palette — Implementation Roadmap

**Version:** 0.1  
**Status:** Draft — awaiting approval

---

## Guiding Principle

> Prioritize elegance over features. Every feature must justify its existence.  
> Build the museum, not the database.

Each phase produces a visually reviewable increment. No phase ships UI that violates the design principles — even scaffolding should feel calm.

---

## Phase Overview

```
Phase 0 ──▶ Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4 ──▶ Phase 5 ──▶ Phase 6
Setup       Foundation   Pipeline     Home         Detail       Preview      Polish
(0.5 day)   (1 day)      (1.5 days)   (1 day)      (1.5 days)   (1 day)      (1 day)
```

**Estimated total:** 7–8 working days for a single engineer.

---

## Phase 0: Project Setup

**Goal:** Runnable Next.js shell with tooling configured.

### Tasks

- [ ] `create-next-app` with TypeScript, Tailwind, App Router
- [ ] Initialize shadcn/ui (New York style, neutral base)
- [ ] Initialize Prisma + PostgreSQL (local Docker or hosted)
- [ ] Configure path aliases, ESLint, Prettier
- [ ] Set up `globals.css` with base typography and whitespace tokens
- [ ] Create `.env.example`

### Exit Criteria

- `npm run dev` serves a blank calm page
- `npx prisma db push` succeeds
- shadcn Button renders correctly

---

## Phase 1: Foundation

**Goal:** Database schema live, layout shell in place, data access layer ready.

### Tasks

- [ ] Implement Prisma schema (all models from database-schema.md)
- [ ] Run initial migration
- [ ] Create `lib/db.ts` Prisma singleton
- [ ] Create `lib/data/birds.ts` query functions (stub returning empty)
- [ ] Build `SiteHeader` + `RootLayout` with typography
- [ ] Build `SectionHeading` shared component
- [ ] Define TypeScript types in `src/types/`

### Exit Criteria

- All tables exist in PostgreSQL
- Layout renders wordmark with correct fonts and spacing
- Query functions typed but return empty arrays

### Design Checkpoint

Review layout shell against anti-patterns — no shadows, no borders on header, generous padding.

---

## Phase 2: Color Extraction Pipeline

**Goal:** Deterministic ingest pipeline that populates all derived data.

### Tasks

- [ ] Implement `lib/color/quantize.ts` — median cut on resized image
- [ ] Implement `lib/color/deduplicate.ts` — merge via CIELAB ΔE
- [ ] Implement `lib/color/dominance.ts` — pixel percentage per swatch
- [ ] Implement `lib/color/accessibility.ts` — WCAG contrast + level flags
- [ ] Implement `lib/color/similarity.ts` — palette distance scoring
- [ ] Implement `lib/color/theme.ts` — buildBirdTheme()
- [ ] Implement `lib/color/extract.ts` — orchestrator tying all together
- [ ] Create `scripts/ingest-bird.ts` — CLI: `npx tsx scripts/ingest-bird.ts --slug northern-cardinal`
- [ ] Create `scripts/ingest-all.ts` — batch runner
- [ ] Create `scripts/compute-similarity.ts` — post-ingest batch
- [ ] Curate 20 seed birds in `prisma/seed/birds.json`
- [ ] Source and place 20 bird images in `prisma/seed/images/`
- [ ] Run full ingest on seed dataset

### Exit Criteria

- All 20 birds in database with palette colors, rule recommendations, accessibility results
- Similar birds computed for each
- Spot-check 3 birds manually — do colors match the image?

### Validation Script

```
For each bird:
  ✓ 5–8 palette colors
  ✓ 1 rule recommendation (60/30/10)
  ✓ ≥ 1 accessibility result with AA
  ✓ 4–6 similar birds
```

---

## Phase 3: Home Page

**Goal:** Search + curated grid — the first impression.

### Tasks

- [ ] Implement `getBirds()` returning real data
- [ ] Build `SearchInput` — large, minimal, debounced
- [ ] Build `BirdThumbnail` — image-first, name below
- [ ] Build `BirdGrid` — responsive CSS grid
- [ ] Build `HomeClient` — client wrapper with filter logic
- [ ] Wire `app/page.tsx` — SSR + client search
- [ ] Empty state for no search results
- [ ] Optimize images with `next/image`

### Exit Criteria

- Home loads with 20 bird thumbnails
- Search filters by name and scientific name instantly
- Grid feels calm — no cards, no shadows, generous whitespace
- Mobile responsive (2 columns)

### Design Checkpoint

Show to stakeholder. Ask: “Does this feel like a museum or a database?” If database, simplify.

---

## Phase 4: Bird Detail Page

**Goal:** Hero image, metadata, color system, and accessibility sections.

### Tasks

- [ ] Implement `getBirdWithPalette(slug)` with all relations
- [ ] Build `BirdHero` — dominant image treatment
- [ ] Build `BirdMetadata` — name, scientific, region, description
- [ ] Build `ColorChip` with copy-to-clipboard
- [ ] Build `DominantColors` + `RuleRecommendation`
- [ ] Build `ColorSystemSection` composing the above
- [ ] Build `AccessibilityRow` + `WcagIndicator`
- [ ] Build `AccessibilitySection`
- [ ] Wire `app/birds/[slug]/page.tsx`
- [ ] Implement 404 for invalid slugs
- [ ] Add `generateMetadata` for SEO
- [ ] Add back link “← All birds”

### Exit Criteria

- `/birds/northern-cardinal` renders full detail with real extracted data
- Color chips copy hex on click with toast confirmation
- Accessibility rows show correct WCAG levels
- Page feels editorial, not data-dense

### Design Checkpoint

Review color system section — are chips flat and elegant? Is the 60/30/10 clear without being chart-like?

---

## Phase 5: Component Preview & Similar Birds

**Goal:** The two features that differentiate Nature Palette from a palette swatch tool.

### Tasks

- [ ] Implement `buildBirdTheme()` mapping palette → CSS variables
- [ ] Build `ThemePreview` wrapper with inline CSS custom properties
- [ ] Build all preview sub-components using shadcn primitives
- [ ] Build `ComponentPreviewSection`
- [ ] Build `SimilarBirdsSection` with compact thumbnails
- [ ] Wire both sections into bird detail page

### Exit Criteria

- Preview section shows button, input, card, badge, alert, nav — all themed with bird colors
- Switching between birds produces visibly different preview themes
- Similar birds section shows 4–6 relevant suggestions
- Preview feels like a design system playground, not a component catalog

### Design Checkpoint

This is the most important section. Review with designer eyes: do the colors feel cohesive in context?

---

## Phase 6: Polish & Launch Readiness

**Goal:** Production-quality refinement.

### Tasks

- [ ] Typography audit — sizes, weights, line-heights across all pages
- [ ] Spacing audit — section margins, grid gaps, content max-width
- [ ] Image optimization — WebP, proper sizes, blur placeholders
- [ ] Performance — Lighthouse audit, target LCP < 2.5s
- [ ] Accessibility audit — keyboard nav, focus states, alt text, contrast of UI chrome itself
- [ ] Responsive QA — test all breakpoints
- [ ] Error boundaries and graceful fallbacks
- [ ] README with setup instructions
- [ ] Final seed data review — descriptions, image quality

### Exit Criteria

- Lighthouse Performance ≥ 90, Accessibility ≥ 95
- No visual element violates design principles doc
- README allows fresh clone → running app in < 10 minutes
- Product feels like a curated museum experience

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Color extraction quality varies by image | High | Curate images manually; tune quantization params |
| shadcn theme override complexity | Medium | CSS variable wrapper pattern; test early in Phase 5 |
| Similar birds feel random | Medium | Tune ΔE threshold; manual curation override option |
| Image licensing | Medium | Use Wikimedia Commons CC-licensed images |
| Scope creep (filters, export, accounts) | High | PRD scope boundaries enforced; defer all v2 features |

---

## Post-v1 Backlog (Not Scheduled)

Ranked by value, not committed:

1. Export palette as CSS variables / Tailwind config
2. Copy all colors button
3. Figma plugin integration
4. Additional taxa (butterflies, coral, minerals)
5. Region/habitat search
6. Keyboard shortcut for search focus (`/`)
7. OG image generation per bird with palette overlay

---

## Approval Checklist

Before implementation begins, confirm:

- [ ] PRD scope and non-goals accepted
- [ ] Information architecture (2 pages, no sidebar) accepted
- [ ] Database schema accepted
- [ ] Route structure accepted
- [ ] Component hierarchy accepted
- [ ] Folder structure accepted
- [ ] Implementation roadmap phasing accepted
- [ ] Open questions resolved (slug strategy, dataset size, image sourcing)

---

*Architecture package complete. Awaiting approval to begin Phase 0.*
