# Nature Palette — Information Architecture

**Version:** 0.1  
**Status:** Draft — awaiting approval

---

## 1. Site Map

Nature Palette is intentionally shallow — two page types, one direction of depth.

```
Nature Palette
│
├── Home                          /
│   ├── Search
│   └── Bird Grid
│
└── Bird Detail                   /birds/[slug]
    ├── Hero Image
    ├── Metadata Block
    ├── Color System
    ├── Accessibility
    ├── UI Component Preview
    └── Similar Birds
```

**Total navigable pages at launch:** 1 + N (where N = number of birds in dataset).

No settings, about, account, or admin pages in v1.

---

## 2. Navigation Model

### Global Chrome (Minimal)

```
┌─────────────────────────────────────────────────┐
│  Nature Palette                    (optional ←) │  ← only on detail page
└─────────────────────────────────────────────────┘
│                                                 │
│                   PAGE CONTENT                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

| Element | Home | Detail |
|---------|------|--------|
| Wordmark “Nature Palette” | Yes, top-left, links to `/` | Yes |
| Back navigation | — | Text link “← All birds” or browser back |
| Footer | None | None |
| Sidebar | None | None |
| Tab bar / menu | None | None |

Navigation is **wayfinding through content**, not through menus.

---

## 3. Page Wireframes (ASCII)

### 3.1 Home

```
┌──────────────────────────────────────────────────────────┐
│  Nature Palette                                          │
│                                                          │
│                                                          │
│              ┌─────────────────────────────┐             │
│              │  🔍  Search birds…          │             │
│              └─────────────────────────────┘             │
│                                                          │
│                                                          │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        │
│   │        │  │        │  │        │  │        │        │
│   │  bird  │  │  bird  │  │  bird  │  │  bird  │        │
│   │        │  │        │  │        │  │        │        │
│   └────────┘  └────────┘  └────────┘  └────────┘        │
│   Cardinal    Kingfisher  Blue Jay    Flamingo           │
│                                                          │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        │
│   │        │  │        │  │        │  │        │        │
│   │  bird  │  │  bird  │  │  bird  │  │  bird  │        │
│   │        │  │        │  │        │  │        │        │
│   └────────┘  └────────┘  └────────┘  └────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Grid behavior:**

- Desktop: 4 columns
- Tablet: 3 columns
- Mobile: 2 columns
- Thumbnail: full-bleed image, name below in small caps or regular weight
- No card borders; spacing creates separation
- Hover: subtle scale (1.02) or opacity shift — no shadow lift

**Search behavior:**

- Debounce 200ms
- Matches `name` and `scientificName` (case-insensitive, partial)
- Grid filters in place — no page transition
- Clear button appears when query is non-empty

---

### 3.2 Bird Detail

```
┌──────────────────────────────────────────────────────────┐
│  Nature Palette                          ← All birds    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │                                                    │  │
│  │              HERO IMAGE (full width)               │  │
│  │                                                    │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Northern Cardinal                                       │
│  Cardinalis cardinalis                                   │
│  Eastern North America                                   │
│                                                          │
│  A vivid crimson songbird common in backyards            │
│  and woodland edges across eastern North America.        │
│                                                          │
│  ── Color System ──────────────────────────────────────  │
│                                                          │
│  Dominant                                                │
│  [■] [■] [■] [■] [■] [■]                                │
│                                                          │
│  60 / 30 / 10                                            │
│  [■ 60%]  [■ 30%]  [■ 10%]                              │
│                                                          │
│  ── Accessibility ─────────────────────────────────────  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  BG ■ #2C1810    Text ■ #F5F0E8    7.2:1  AA AAA │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  BG ■ #8B1A1A    Text ■ #FFFFFF    5.1:1  AA  —   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ── In Context ────────────────────────────────────────  │
│                                                          │
│  ┌─ Preview Canvas (bird theme applied) ─────────────┐  │
│  │  [Nav: Home  Birds  About]                         │  │
│  │  [Button Primary]  [Button Outline]                │  │
│  │  [Input placeholder…                    ]          │  │
│  │  ┌ Card ──────────────────────────────┐           │  │
│  │  │ Card title                          │           │  │
│  │  │ Card description text               │           │  │
│  │  └─────────────────────────────────────┘           │  │
│  │  [Badge]  [Alert: Information message]            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ── Similar Palettes ──────────────────────────────────  │
│                                                          │
│  [thumb] [thumb] [thumb] [thumb]                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Content Hierarchy & Typography

| Level | Element | Treatment |
|-------|---------|-----------|
| H1 | Bird name | Large, serif or refined sans, tight tracking |
| H2 | Section labels (“Color System”, “Accessibility”, “In Context”, “Similar Palettes”) | Small caps or uppercase, muted color, generous top margin |
| Body | Description | 16–18px, relaxed line-height (1.6–1.7), max-width ~65ch |
| Caption | Scientific name | Italic, muted |
| Meta | Location | Regular weight, muted |
| Data | Hex values | Monospace, appears on interaction |

**Type scale (proposed):**

```
--text-xs:   0.75rem   (labels, hex)
--text-sm:   0.875rem  (scientific name, meta)
--text-base: 1rem      (body)
--text-lg:   1.125rem  (section intros)
--text-xl:   1.25rem   (wordmark)
--text-3xl:  1.875rem  (bird name)
--text-4xl:  2.25rem   (bird name desktop)
```

---

## 5. Content Model

### Bird (Page Entity)

| Field | Display | Searchable |
|-------|---------|------------|
| name | H1 | Yes |
| scientificName | Caption | Yes |
| description | Body paragraph | No |
| region | Meta line | No (v1) |
| habitat | Stored, not displayed in v1 | No |
| imageUrl | Hero + thumbnail | No |

### Derived Content (Computed at Ingest)

| Entity | Display Location |
|--------|------------------|
| ColorPalette | Color System section |
| RuleRecommendation (60/30/10) | Color System section |
| AccessibilityResult | Accessibility section |
| SimilarBirds | Similar Palettes section |

Nothing is user-editable. All content is curated and pre-computed.

---

## 6. Interaction Patterns

| Action | Pattern |
|--------|---------|
| Browse birds | Click thumbnail → navigate to detail |
| Search | Type → grid filters in place |
| Copy color | Click chip → hex copied, subtle toast |
| View similar | Click thumbnail in similar section |
| Return home | Wordmark or “← All birds” |

**No modals, drawers, or tooltips except copy confirmation.**

---

## 7. Responsive Strategy

| Breakpoint | Layout Changes |
|------------|----------------|
| < 640px | 2-col grid, hero full-bleed, stacked sections |
| 640–1024px | 3-col grid, hero max-height 60vh |
| > 1024px | 4-col grid, hero max-height 70vh, max content width 960px centered |

Content max-width: **960px** on detail pages. Home grid can extend to **1200px**.

---

## 8. Empty & Error States

| State | Treatment |
|-------|-----------|
| No search results | “No birds match your search.” — centered, muted |
| Bird not found (404) | “This bird doesn’t exist.” + link home |
| Missing image | Neutral placeholder, never a broken icon |
| Pipeline failure | Bird excluded from grid until resolved |

All error states follow the same calm, minimal voice.

---

## 9. SEO & Sharing

| Page | Title | OG Image |
|------|-------|----------|
| Home | Nature Palette — Color systems from nature | Curated composite or first bird |
| Detail | {Bird Name} — Nature Palette | Bird hero image |

Meta description on detail: first sentence of bird description.

---

*Next document: [Database Schema](./database-schema.md)*
