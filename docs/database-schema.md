# Nature Palette — Database Schema

**Version:** 0.1  
**Status:** Draft — awaiting approval  
**ORM:** Prisma · **Database:** PostgreSQL

---

## 1. Entity Relationship Diagram

```
┌─────────────┐       1:N        ┌──────────────────┐
│    Bird     │─────────────────▶│   PaletteColor   │
│             │                  │                  │
│  id         │                  │  id              │
│  slug       │       1:1        │  birdId          │
│  name       │─────────────────▶│  hex             │
│  ...        │                  │  rgb             │
└─────────────┘                  │  dominancePct    │
       │                         │  sortOrder       │
       │ 1:1                     └──────────────────┘
       ▼
┌──────────────────┐
│ RuleRecommendation│
│                  │
│  birdId          │
│  primaryHex      │  ← 60%
│  secondaryHex    │  ← 30%
│  accentHex       │  ← 10%
└──────────────────┘

       │ 1:N
       ▼
┌──────────────────────┐
│ AccessibilityResult  │
│                      │
│  birdId              │
│  foreground          │
│  background          │
│  contrastRatio       │
│  levelAA             │
│  levelAAA            │
│  sortOrder           │
└──────────────────────┘

       │ N:M (self-referential)
       ▼
┌──────────────────┐
│  SimilarBird     │
│                  │
│  birdId          │
│  similarBirdId   │
│  similarityScore │
│  rank            │
└──────────────────┘
```

---

## 2. Prisma Schema

> **v0.2 changes:** Added `colorTags` for color search ("green" → green birds) and
> replaced the single `RuleRecommendation` with multiple `PaletteVariation`s so a bird
> with several strong primaries can offer Palette 1 / 2 / 3.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Bird {
  id             String   @id @default(cuid())
  slug           String   @unique
  name           String
  scientificName String   @map("scientific_name")
  description    String   @db.Text
  habitat        String?
  region         String
  imageUrl       String   @map("image_url")
  thumbUrl       String?  @map("thumb_url")
  imageCredit    String?  @map("image_credit")   // Wikimedia attribution
  imageLicense   String?  @map("image_license")  // e.g. "CC BY-SA 4.0"
  sourceUrl      String?  @map("source_url")      // Wikipedia/Commons page
  colorTags      String[] @map("color_tags")      // ["red","brown","white"] for search
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  paletteColors        PaletteColor[]
  paletteVariations    PaletteVariation[]
  accessibilityResults AccessibilityResult[]
  similarTo            SimilarBird[] @relation("BirdSimilarities")
  similarFrom          SimilarBird[] @relation("SimilarBirdRefs")

  @@index([name])
  @@index([scientificName])
  @@map("birds")
}

model PaletteColor {
  id              String  @id @default(cuid())
  birdId          String  @map("bird_id")
  hex             String  // "#RRGGBB"
  rgb             String  // "r,g,b"
  dominancePct    Float   @map("dominance_pct") // 0.0 – 100.0
  sortOrder       Int     @map("sort_order")    // 0 = most dominant

  bird Bird @relation(fields: [birdId], references: [id], onDelete: Cascade)

  @@index([birdId])
  @@map("palette_colors")
}

model PaletteVariation {
  id            String @id @default(cuid())
  birdId        String @map("bird_id")
  name          String                          // "Palette 1", "Crimson", etc.
  rank          Int                             // 0 = recommended/default
  primaryHex    String @map("primary_hex")      // 60%
  secondaryHex  String @map("secondary_hex")    // 30%
  accentHex     String @map("accent_hex")        // 10%
  backgroundHex String @map("background_hex")    // canvas for previews
  foregroundHex String @map("foreground_hex")    // best-contrast text

  bird Bird @relation(fields: [birdId], references: [id], onDelete: Cascade)

  @@index([birdId])
  @@map("palette_variations")
}

enum WcagLevel {
  AA
  AAA
}

model AccessibilityResult {
  id             String  @id @default(cuid())
  birdId         String  @map("bird_id")
  foreground     String  // hex
  background     String  // hex
  contrastRatio  Float   @map("contrast_ratio")
  levelAA        Boolean @map("level_aa")
  levelAAA       Boolean @map("level_aaa")
  sortOrder      Int     @map("sort_order")

  bird Bird @relation(fields: [birdId], references: [id], onDelete: Cascade)

  @@index([birdId])
  @@map("accessibility_results")
}

model SimilarBird {
  id             String @id @default(cuid())
  birdId         String @map("bird_id")
  similarBirdId  String @map("similar_bird_id")
  similarityScore Float @map("similarity_score") // 0.0 – 1.0, higher = more similar
  rank           Int    // 1–6

  bird         Bird @relation("BirdSimilarities", fields: [birdId], references: [id], onDelete: Cascade)
  similarBird  Bird @relation("SimilarBirdRefs", fields: [similarBirdId], references: [id], onDelete: Cascade)

  @@unique([birdId, similarBirdId])
  @@index([birdId])
  @@map("similar_birds")
}
```

---

## 3. Field Rationale

### Bird.slug

- URL-safe identifier derived from name: `northern-cardinal`
- Unique, immutable after creation
- Used in routes: `/birds/northern-cardinal`

### PaletteColor.dominancePct

- Percentage of image pixels represented by this color (after quantization)
- Used for sort order and 60/30/10 assignment

### RuleRecommendation

- Pre-computed from top 3 palette colors by dominance
- Stored separately so detail page requires no runtime logic

### AccessibilityResult

- Pre-computed pairings from palette colors
- `levelAA` / `levelAAA` as booleans for simple display
- `sortOrder`: AAA pairings first, then by contrast ratio descending

### SimilarBird

- Pre-computed at ingest or via batch job after all birds loaded
- `rank` 1–6 controls display order
- `similarityScore` used for ranking, not shown to user

---

## 4. Indexes & Query Patterns

| Query | Tables | Index Used |
|-------|--------|------------|
| List all birds (home grid) | `birds` | PK scan, ordered by `name` |
| Search birds | `birds` | `name`, `scientific_name` |
| Bird by slug | `birds` | `slug` (unique) |
| Palette for bird | `palette_colors` | `bird_id` |
| Accessibility for bird | `accessibility_results` | `bird_id` |
| Similar birds | `similar_birds` JOIN `birds` | `bird_id` |

---

## 5. Seed Data Strategy

```
scripts/
├── seed-birds.ts          # Insert bird metadata
├── ingest-images.ts       # Process images → extract colors
└── compute-similarity.ts  # Batch similarity after all birds ingested
```

**Initial dataset:** 20–30 hand-curated birds with high-quality, color-rich photography.

Bird JSON seed format:

```json
{
  "slug": "northern-cardinal",
  "name": "Northern Cardinal",
  "scientificName": "Cardinalis cardinalis",
  "description": "A vivid crimson songbird common in backyards and woodland edges across eastern North America.",
  "region": "Eastern North America",
  "habitat": "Woodland edges, gardens, shrublands",
  "imagePath": "./seed-images/northern-cardinal.jpg"
}
```

---

## 6. Color Extraction Pipeline (Data Flow)

```
┌──────────────┐
│  Source JPG  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  1. Resize (max 200px longest edge)  │  sharp
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  2. Median Cut quantization          │  custom or node-vibrant
│     → 16 candidate colors            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  3. Merge duplicates (ΔE < 5)        │  culori (lab difference)
│     → 5–8 final swatches             │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  4. Calculate dominance % per swatch │  pixel counting
└──────┬───────────────────────────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌─────────────────────┐          ┌─────────────────────────┐
│ 5a. RuleRecommend   │          │ 5b. AccessibilityResults│
│  Top 3 → 60/30/10   │          │  All fg×bg combos       │
│                     │          │  Filter: ratio ≥ 4.5    │
└─────────────────────┘          │  Sort: AAA > AA > ratio │
                                 └─────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  6. Upload image → store imageUrl    │
│  7. Insert all records via Prisma    │
└──────────────────────────────────────┘
```

### Accessibility Calculation Rules

```
For each pair (foreground, background) in palette colors:
  contrastRatio = WCAG relative luminance formula
  levelAA  = contrastRatio >= 4.5  (normal text)
  levelAAA = contrastRatio >= 7.0

Store pairs where levelAA == true
Cap at 12 stored, display top 6
Prefer dark-on-light and light-on-dark pairings
```

### Similarity Calculation

```
For bird A and bird B:
  paletteA = top 6 colors by dominance
  paletteB = top 6 colors by dominance

  For each color in A, find minimum ΔE to any color in B
  similarity = 1 - (averageMinΔE / 100)  // normalized

  Store top 6 most similar birds per bird
  Exclude self
```

---

## 7. Migration Strategy

1. `npx prisma migrate dev --name init` — create all tables
2. Run seed script with bird metadata
3. Run ingest pipeline per bird
4. Run similarity batch job
5. Verify counts: each bird should have 5–8 palette colors, 1 rule recommendation, 1–6 accessibility results, 4–6 similar birds

---

*Next document: [Routes & Components](./routes-and-components.md)*
