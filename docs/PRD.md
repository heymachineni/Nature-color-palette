# Nature Palette — Product Requirements Document

**Version:** 0.1  
**Status:** Draft — awaiting approval  
**Date:** June 14, 2026

---

## 1. Product Thesis

Nature Palette is a **visual discovery tool** that lets designers explore color systems already perfected by nature. Birds are the starting point. Every bird becomes a living design system — not an encyclopedia entry, not a palette generator output.

The product should feel like a **museum of nature-inspired design systems**: calm, elegant, minimal, and highly curated.

### Design North Stars

| Reference | What we borrow |
|-----------|----------------|
| Apple HIG | Clarity, deference to content, generous whitespace |
| Linear | Restrained UI, invisible chrome, typographic hierarchy |
| Stripe Press | Editorial quality, confidence through simplicity |
| Notion | Approachable calm, content-first layout |

### Anti-Patterns (Explicit Non-Goals)

- Dashboard or admin-panel aesthetic
- Data-heavy interfaces, charts, or analytics widgets
- Dense controls, filters, sidebars (initially)
- Complex settings or configuration screens
- Excessive cards, shadows, gradients, or skeuomorphism
- AI-generated color analysis
- Bird encyclopedia features (life history, taxonomy trees, birdwatching tools)
- Generic “upload an image, get a palette” utility

---

## 2. Problem & Opportunity

Designers repeatedly solve the same problem: finding cohesive, accessible color systems that feel intentional. Nature has already solved this through millions of years of visual evolution. Nature Palette translates that into actionable design tokens — with accessibility baked in and real UI previews that prove the palette works.

---

## 3. Target Users

| Persona | Need |
|---------|------|
| Product designer | Quick inspiration for brand or feature color direction |
| Design system engineer | Starting point for token sets with proven contrast |
| Brand designer | Nature-authentic palettes with editorial presentation |
| UI designer | See how colors behave on real components before committing |

**Primary use case:** Browse → discover a palette → copy/export colors → apply in Figma or code.

**Secondary use case:** Search for a specific bird by name when referred or curious.

---

## 4. Core User Flow

```
Arrive → Search or browse grid → Select bird → Explore color system
                                              → Review accessibility
                                              → Preview on UI components
                                              → Discover similar birds
```

### 4.1 Home

**First paint:** A large search input (“Search birds…”) and a curated grid of bird thumbnails. Nothing else.

| Element | Behavior |
|---------|----------|
| Search input | Filters birds by common name and scientific name (debounced, instant) |
| Bird grid | Responsive masonry or uniform grid; image-first thumbnails |
| Empty search | Shows full curated set |
| No results | Quiet empty state — single line of copy, no illustration clutter |

**Explicitly absent at launch:** Sidebars, filters, categories, sort controls, pagination UI (use infinite scroll or a generous initial set).

### 4.2 Bird Detail Page

Content order is fixed and intentional — the image leads, the system follows.

1. **Hero image** — dominates viewport; no competing chrome
2. **Metadata** — name, scientific name, location, short description
3. **Color system** — primary feature
4. **Accessibility** — computed pairings with WCAG levels
5. **UI component preview** — palette applied to shadcn components
6. **Similar birds** — 4–6 curated suggestions

---

## 5. Feature Specifications

### 5.1 Color System Section

**Outputs (deterministic, pre-computed at ingest):**

| Output | Description |
|--------|-------------|
| Dominant colors | Top 5–8 colors ranked by pixel dominance |
| Accessible pairings | Foreground/background pairs meeting WCAG AA minimum |
| 60 / 30 / 10 recommendation | Primary, secondary, accent assignment from top 3 dominant colors |

**Presentation:**

- Horizontal row of flat color chips
- Hex value on hover or tap (copy to clipboard)
- No gradients, shadows, or 3D effects
- Dominance shown as subtle percentage label, not a chart

### 5.2 Accessibility Section

For each recommended pairing:

| Field | Example |
|-------|---------|
| Background color | `#2C4A3E` |
| Text color | `#F5F0E8` |
| Contrast ratio | `7.2:1` |
| WCAG level | AA ✓ · AAA ✓ |

**Rules:**

- Simple text indicators (✓ / —), not gauges or charts
- Sort pairings: AAA first, then AA
- Cap visible pairings at 6 to avoid noise

### 5.3 UI Component Preview Section

Apply the bird’s palette as CSS custom properties and render shadcn/ui components:

| Component | Purpose |
|-----------|---------|
| Button | Primary, secondary, outline variants |
| Input | Form field with focus ring |
| Card | Surface + border treatment |
| Badge | Accent color usage |
| Alert | Semantic color application |
| Navigation | Horizontal nav bar sample |

This section is a **design system playground** — the user should instantly understand how the palette behaves in production UI. Components sit on a neutral canvas; the bird palette drives `--primary`, `--secondary`, `--accent`, `--background`, `--foreground`, etc.

### 5.4 Similar Birds

- Algorithm: palette similarity via color distance in CIELAB space (see Architecture docs)
- Display: 4–6 birds maximum
- Presentation: same thumbnail treatment as home grid
- No “similarity score” shown to user

---

## 6. Color Extraction Pipeline (Requirements)

Deterministic. No AI APIs. Runs at ingest time (not on user request).

```
Image ingest → Resize → Quantize → Deduplicate → Rank by dominance
             → Generate pairings → Calculate WCAG → Compute 60/30/10
             → Store in PostgreSQL → Precompute similar birds
```

**Quality bar:**

- Duplicate colors merged when ΔE < 5 (CIELAB)
- Minimum 3, maximum 8 palette swatches stored
- All accessibility results persisted (not computed client-side)

---

## 7. Technical Constraints

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| ORM | Prisma |
| Database | PostgreSQL |
| Image processing | sharp |
| Color math | culori |

---

## 8. Success Metrics (Post-Launch)

| Metric | Target |
|--------|--------|
| Time to first palette view | < 2s on home |
| Bird detail LCP | < 2.5s |
| Palette copy action | Track via analytics (future) |
| Bounce rate on home | Low — indicates grid is engaging |

*Analytics are out of scope for v0.1 architecture.*

---

## 9. Scope Boundaries

### In Scope (v1)

- Home page with search + grid
- Bird detail with all five content sections
- Deterministic color extraction pipeline
- Seed dataset (~20–30 curated birds)
- Responsive layout (mobile-first)
- Copy hex to clipboard

### Out of Scope (v1)

- User accounts / favorites
- Export to Figma, CSS, Tailwind config
- Filters, categories, regions
- Admin UI for bird management
- User-uploaded images
- Additional taxa (plants, insects, etc.)
- Dark mode toggle (each bird *is* its own theme)

---

## 10. Open Questions for Approval

1. **URL strategy:** `/birds/northern-cardinal` (slug) vs `/birds/[id]` — recommend slug for shareability.
2. **Initial dataset size:** 20 birds curated manually, or 50+ from a seed script?
3. **Image sourcing:** User-provided assets, Wikimedia Commons, or a licensed stock set?
4. **Search scope:** Name only, or also region/habitat keywords?

---

*Next document: [Information Architecture](./information-architecture.md)*
