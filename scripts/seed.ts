/**
 * Seeds PostgreSQL from prisma/seed/dataset.json (produced by `npm run ingest`).
 * Idempotent: clears existing rows, then inserts birds, palettes, accessibility
 * results, and cross-bird similarity.
 *
 * Run with:  npm run db:seed
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

/** Load `.env` when present (Node does not do this automatically for scripts). */
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

if (!process.env.DATABASE_URL) {
  console.error(`
DATABASE_URL is not set.

Preview without Postgres (uses dataset.json):
  npm run dev

To seed PostgreSQL:
  cp .env.example .env
  docker compose up -d
  npm run db:push
  npm run db:seed
`);
  process.exit(1);
}

const prisma = new PrismaClient();

type RawBird = {
  slug: string;
  name: string;
  scientificName: string;
  description: string;
  habitat: string | null;
  region: string;
  imageUrl: string;
  thumbUrl: string | null;
  imageCredit: string | null;
  imageLicense: string | null;
  sourceUrl: string | null;
  colorTags: string[];
  paletteColors: any[];
  paletteVariations: any[];
  accessibilityResults: any[];
  similar: { slug: string; similarityScore: number; rank: number }[];
};

async function main() {
  const file = path.join(process.cwd(), "prisma", "seed", "dataset.json");
  const { birds } = JSON.parse(readFileSync(file, "utf-8")) as {
    birds: RawBird[];
  };

  console.log(`\nSeeding ${birds.length} birds…`);

  // Clean slate (cascade removes children).
  await prisma.similarBird.deleteMany();
  await prisma.bird.deleteMany();

  const slugToId = new Map<string, string>();

  for (const b of birds) {
    const created = await prisma.bird.create({
      data: {
        slug: b.slug,
        name: b.name,
        scientificName: b.scientificName,
        description: b.description,
        habitat: b.habitat,
        region: b.region,
        imageUrl: b.imageUrl,
        thumbUrl: b.thumbUrl,
        imageCredit: b.imageCredit,
        imageLicense: b.imageLicense,
        sourceUrl: b.sourceUrl,
        colorTags: b.colorTags,
        paletteColors: {
          create: b.paletteColors.map((c) => ({
            hex: c.hex,
            rgb: c.rgb,
            dominancePct: c.dominancePct,
            colorName: c.colorName,
            sortOrder: c.sortOrder,
          })),
        },
        paletteVariations: {
          create: b.paletteVariations.map((v) => ({
            name: v.name,
            rank: v.rank,
            primaryHex: v.primaryHex,
            secondaryHex: v.secondaryHex,
            accentHex: v.accentHex,
            backgroundHex: v.backgroundHex,
            foregroundHex: v.foregroundHex,
          })),
        },
        accessibilityResults: {
          create: b.accessibilityResults.map((a) => ({
            foreground: a.foreground,
            background: a.background,
            contrastRatio: a.contrastRatio,
            levelAA: a.levelAA,
            levelAAA: a.levelAAA,
            sortOrder: a.sortOrder,
          })),
        },
      },
    });
    slugToId.set(b.slug, created.id);
  }

  for (const b of birds) {
    const birdId = slugToId.get(b.slug)!;
    for (const s of b.similar) {
      const similarBirdId = slugToId.get(s.slug);
      if (!similarBirdId) continue;
      await prisma.similarBird.create({
        data: {
          birdId,
          similarBirdId,
          similarityScore: s.similarityScore,
          rank: s.rank,
        },
      });
    }
  }

  console.log("✓ Seed complete.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
