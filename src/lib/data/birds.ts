import { cache } from "react";
import type { BirdDetail, BirdSummary, DesignerModeData } from "@/types/bird";
import { buildDesignerModes } from "@/lib/color/modes";
import { inferCharacter } from "@/lib/color/character";
import { generateTokenPairings } from "@/lib/color/token-pairings";
import type { ExtractedColor } from "@/lib/color/extract";
import { getDatasetBirds, toDetail, toSummary } from "./dataset";
import { isFirestoreConfigured } from "@/lib/firebase/admin";

/**
 * Data access layer.
 *
 * Priority: Firestore → PostgreSQL → dataset.json
 */
const useFirestore =
  isFirestoreConfigured() && process.env.USE_JSON_DATA !== "true";
const useDatabase =
  !useFirestore &&
  Boolean(process.env.DATABASE_URL) &&
  process.env.USE_JSON_DATA !== "true";

function mapModes(
  modes: ReturnType<typeof buildDesignerModes>,
): DesignerModeData[] {
  return modes.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    rank: m.rank,
    strategy: {
      id: m.strategy.id,
      name: m.strategy.name,
      description: m.strategy.description,
      personality: m.strategy.personality,
    },
    curated: m.curated,
    tokens: m.tokens,
    insight: m.insight,
  }));
}

function modesFromPaletteColors(
  paletteColors: {
    hex: string;
    rgb: string;
    dominancePct: number;
    colorName: string;
  }[],
) {
  const raw: ExtractedColor[] = paletteColors.map((c) => ({
    hex: c.hex,
    rgb: c.rgb,
    rgbValues: { r: 0, g: 0, b: 0 },
    dominancePct: c.dominancePct,
    colorName: c.colorName,
  }));
  return mapModes(buildDesignerModes(raw));
}

export const getBirds = cache(async (): Promise<BirdSummary[]> => {
  if (useFirestore) {
    const { getFirestoreBirds } = await import("./firestore");
    return getFirestoreBirds();
  }

  if (useDatabase) {
    const { prisma } = await import("@/lib/db");
    const birds = await prisma.bird.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        scientificName: true,
        thumbUrl: true,
        imageUrl: true,
        colorTags: true,
        paletteColors: {
          orderBy: { sortOrder: "asc" },
          select: {
            hex: true,
            rgb: true,
            dominancePct: true,
            colorName: true,
          },
        },
      },
    });
    return birds.map(({ paletteColors, ...bird }) => {
      const modes = modesFromPaletteColors(paletteColors);
      const t = modes[0].tokens;
      return {
        ...bird,
        characterTags: inferCharacter(modes[0].curated),
        palettePreview: [t.primary, t.accent, t.surface, t.border],
      };
    });
  }

  return getDatasetBirds()
    .map(toSummary)
    .sort((a, b) => a.name.localeCompare(b.name));
});

export const getBirdBySlug = cache(
  async (slug: string): Promise<BirdDetail | null> => {
    if (useFirestore) {
      const { getFirestoreBirdBySlug } = await import("./firestore");
      return getFirestoreBirdBySlug(slug);
    }

    if (useDatabase) {
      const { prisma } = await import("@/lib/db");
      const bird = await prisma.bird.findUnique({
        where: { slug },
        include: {
          paletteColors: { orderBy: { sortOrder: "asc" } },
          accessibilityResults: { orderBy: { sortOrder: "asc" } },
          similarTo: {
            orderBy: { rank: "asc" },
            include: { similarBird: true },
          },
        },
      });
      if (!bird) return null;

      const paletteColors = bird.paletteColors.map((c) => ({
        hex: c.hex,
        rgb: c.rgb,
        dominancePct: c.dominancePct,
        colorName: c.colorName,
        sortOrder: c.sortOrder,
      }));
      const designerModes = modesFromPaletteColors(paletteColors);
      const accessibilityResults = generateTokenPairings(
        designerModes[0].tokens,
      ).map((p, i) => ({
        ...p,
        sortOrder: i,
      }));

      return {
        id: bird.id,
        slug: bird.slug,
        name: bird.name,
        scientificName: bird.scientificName,
        description: bird.description,
        habitat: bird.habitat,
        region: bird.region,
        imageUrl: bird.imageUrl,
        thumbUrl: bird.thumbUrl,
        imageCredit: bird.imageCredit,
        imageLicense: bird.imageLicense,
        sourceUrl: bird.sourceUrl,
        colorTags: bird.colorTags,
        characterTags: inferCharacter(designerModes[0].curated),
        paletteColors,
        designerModes,
        accessibilityResults,
        similar: bird.similarTo.slice(0, 6).map((s) => ({
          slug: s.similarBird.slug,
          name: s.similarBird.name,
          thumbUrl: s.similarBird.thumbUrl,
          imageUrl: s.similarBird.imageUrl,
        })),
      };
    }

    const all = getDatasetBirds();
    const bird = all.find((b) => b.slug === slug);
    return bird ? toDetail(bird, all) : null;
  },
);
