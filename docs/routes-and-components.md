# Nature Palette — Route Structure & Component Hierarchy

**Version:** 0.1  
**Status:** Draft — awaiting approval

---

## 1. Route Structure

### 1.1 App Router Map

```
src/app/
├── layout.tsx                 # Root layout, fonts, global styles
├── page.tsx                   # Home — search + bird grid
├── not-found.tsx              # Global 404
├── birds/
│   └── [slug]/
│       └── page.tsx           # Bird detail page
└── api/                       # Internal only (no public API v1)
    └── (none at launch — all SSR)
```

### 1.2 Routes

| Route | Method | Rendering | Purpose |
|-------|--------|-----------|---------|
| `/` | GET | SSR + client search filter | Home |
| `/birds/[slug]` | GET | SSR | Bird detail |
| `/not-found` | — | Static | 404 |

**No API routes at launch.** Search filtering happens client-side against data passed from SSR. Bird detail is fully server-rendered with pre-computed palette data.

### 1.3 URL Conventions

```
/                           → Home
/birds/northern-cardinal    → Bird detail
/birds/invalid-slug         → 404
```

Slugs are lowercase, hyphenated, derived from common name.

### 1.4 Metadata & SEO

```typescript
// app/page.tsx
export const metadata = {
  title: 'Nature Palette',
  description: 'Explore color systems perfected by nature.',
}

// app/birds/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const bird = await getBirdBySlug(params.slug)
  return {
    title: `${bird.name} — Nature Palette`,
    description: bird.description.slice(0, 160),
    openGraph: { images: [bird.imageUrl] },
  }
}
```

---

## 2. Data Fetching Strategy

| Page | Strategy | Cache |
|------|----------|-------|
| Home | `getBirds()` — id, slug, name, imageUrl only | `revalidate: 3600` |
| Detail | `getBirdWithPalette(slug)` — full join | `revalidate: 3600` |

Search runs client-side on the home page bird list (typically < 50 items). No server round-trip needed.

---

## 3. Component Hierarchy

### 3.1 Tree Overview

```
RootLayout
├── SiteHeader
│   └── Wordmark
│
├── HomePage
│   ├── SearchInput
│   └── BirdGrid
│       └── BirdThumbnail (×N)
│
└── BirdDetailPage
    ├── BackLink
    ├── BirdHero
    ├── BirdMetadata
    │   ├── BirdName
    │   ├── ScientificName
    │   ├── Region
    │   └── Description
    ├── ColorSystemSection
    │   ├── SectionHeading
    │   ├── DominantColors
    │   │   └── ColorChip (×N)
    │   └── RuleRecommendation
    │       └── ColorChip (×3, with percentage label)
    ├── AccessibilitySection
    │   ├── SectionHeading
    │   └── AccessibilityRow (×N)
    │       ├── ColorSwatch (bg)
    │       ├── ColorSwatch (fg)
    │       ├── ContrastScore
    │       └── WcagIndicator
    ├── ComponentPreviewSection
    │   ├── SectionHeading
    │   └── ThemePreview
    │       ├── PreviewNavigation
    │       ├── PreviewButtons
    │       ├── PreviewInput
    │       ├── PreviewCard
    │       ├── PreviewBadge
    │       └── PreviewAlert
    └── SimilarBirdsSection
        ├── SectionHeading
        └── BirdGrid (compact)
            └── BirdThumbnail (×4–6)
```

---

## 4. Component Specifications

### 4.1 Layout Components

#### `SiteHeader`
- Props: `showBackLink?: boolean`
- Renders wordmark + optional “← All birds” link
- Fixed or static top — no sticky shadow bar
- Height: 64px, transparent background

#### `RootLayout`
- Loads fonts (Inter + optional serif for bird names)
- Sets base Tailwind styles
- No footer

---

### 4.2 Home Components

#### `SearchInput`
- Props: `value`, `onChange`, `placeholder`
- Large, centered, border-bottom only (no box shadow)
- Client component (`"use client"`)
- Icon: subtle search icon, left-aligned inside input

#### `BirdGrid`
- Props: `birds: BirdSummary[]`
- CSS Grid, responsive columns
- No wrapper cards — images float in whitespace

#### `BirdThumbnail`
- Props: `slug`, `name`, `imageUrl`, `size?: 'default' | 'compact'`
- `<Link>` wrapping image + name
- Image: `aspect-square`, `object-cover`, subtle rounded corners (4px max)
- Name: below image, `text-sm`, truncated if needed

---

### 4.3 Bird Detail Components

#### `BirdHero`
- Props: `imageUrl`, `name` (for alt text)
- Full content width, max-height 70vh
- `object-fit: cover`
- No overlay, no caption on image

#### `BirdMetadata`
- Composes name, scientific name, region, description
- Max-width constrained for readability

#### `ColorChip`
- Props: `hex`, `label?`, `dominancePct?`, `onCopy?`
- Flat square or slightly rounded rectangle
- Size: 48×48px default, 64×64px for 60/30/10
- Click → copy hex + toast
- Hover → show hex tooltip (minimal)

#### `DominantColors`
- Horizontal flex row, gap 12px
- Maps `paletteColors` to `ColorChip`

#### `RuleRecommendation`
- Three chips with “60%”, “30%”, “10%” labels below
- Labels in muted text, not inside chip

#### `AccessibilityRow`
- Single horizontal row per pairing
- Background swatch + foreground swatch + ratio + AA/AAA indicators
- Indicators: “AA ✓”, “AAA ✓”, or “—”
- No progress bars

#### `WcagIndicator`
- Props: `levelAA: boolean`, `levelAAA: boolean`
- Minimal text badges

---

### 4.4 Component Preview (Critical Feature)

#### `ThemePreview`
- Props: `theme: BirdTheme` (derived from palette + rule recommendation)
- Wraps children in a div with CSS custom properties set inline
- Neutral outer container with subtle border (1px, muted)

```typescript
interface BirdTheme {
  primary: string      // 60% color
  secondary: string    // 30% color
  accent: string       // 10% color
  background: string   // lightest palette color or computed
  foreground: string   // best contrast text color
  muted: string        // secondary at reduced opacity
  border: string       // derived from foreground at 10% opacity
}
```

#### Preview Sub-Components

Each preview component uses shadcn/ui primitives styled via the theme wrapper:

| Component | shadcn Base | Variants Shown |
|-----------|-------------|----------------|
| `PreviewNavigation` | Custom nav | 3 links, one active |
| `PreviewButtons` | `Button` | default, outline, secondary |
| `PreviewInput` | `Input` | with placeholder |
| `PreviewCard` | `Card` | title + description |
| `PreviewBadge` | `Badge` | default |
| `PreviewAlert` | `Alert` | info variant |

**Theme application pattern:**

```tsx
<div
  style={{
    '--primary': theme.primary,
    '--secondary': theme.secondary,
    '--accent': theme.accent,
    '--background': theme.background,
    '--foreground': theme.foreground,
    // ... mapped to shadcn CSS variable convention
  } as React.CSSProperties}
  className="rounded-lg p-8 space-y-6"
>
  <PreviewNavigation />
  <PreviewButtons />
  {/* ... */}
</div>
```

The preview section title: **“In Context”** — not “UI Preview” or “Component Library”.

---

### 4.5 Shared Components

#### `SectionHeading`
- Props: `children: string`
- Uppercase or small-caps, muted, with generous `margin-top` (64px+)
- Thin horizontal rule optional — prefer whitespace alone

#### `CopyToast`
- Uses shadcn `Sonner` or minimal custom toast
- Message: “Copied #RRGGBB”
- Auto-dismiss 2s

---

## 5. Server vs Client Boundaries

| Component | Server | Client | Reason |
|-----------|--------|--------|--------|
| RootLayout | ✓ | | Static shell |
| SiteHeader | ✓ | | Static |
| HomePage (page) | ✓ | | SSR data fetch |
| SearchInput | | ✓ | Input state |
| BirdGrid | ✓ | | Can filter via parent client wrapper |
| BirdDetailPage | ✓ | | SSR full data |
| ColorChip | | ✓ | Copy interaction |
| ThemePreview | ✓ | | Static themed components |
| SimilarBirdsSection | ✓ | | Static links |

**Pattern for home search:** Server component fetches birds → passes to `HomeClient` wrapper that holds search state and filters the array.

```tsx
// app/page.tsx (Server)
const birds = await getBirds()
return <HomeClient initialBirds={birds} />

// components/home/home-client.tsx (Client)
'use client'
export function HomeClient({ initialBirds }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => filterBirds(initialBirds, query), [...])
  return (...)
}
```

---

## 6. Theme Token Mapping

Bird palette → shadcn CSS variables:

| shadcn Variable | Source |
|-----------------|--------|
| `--primary` | RuleRecommendation.primaryHex |
| `--primary-foreground` | Best contrast text on primary |
| `--secondary` | RuleRecommendation.secondaryHex |
| `--secondary-foreground` | Best contrast text on secondary |
| `--accent` | RuleRecommendation.accentHex |
| `--accent-foreground` | Best contrast text on accent |
| `--background` | Lightest palette color (luminance > 0.9) or `#FAFAFA` |
| `--foreground` | Darkest palette color or best AA pairing foreground |
| `--muted` | Secondary at 15% opacity |
| `--muted-foreground` | Foreground at 60% opacity |
| `--border` | Foreground at 10% opacity |
| `--ring` | Primary color |

Computed at build/ingest time where possible; `buildBirdTheme()` utility for runtime derivation from stored data.

---

*Next document: [Folder Structure](./folder-structure.md)*
