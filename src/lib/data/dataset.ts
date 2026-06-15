import { readFileSync } from "node:fs";
import path from "node:path";
import { buildDesignerModes } from "@/lib/color/modes";
import { inferCharacter } from "@/lib/color/character";
import { generateTokenPairings } from "@/lib/color/token-pairings";
import { hydrateTokens } from "@/lib/color/tokens";
import { strategyForMode } from "@/lib/color/strategy";
import type { CuratedPalette } from "@/lib/color/interpret";
import type { ExtractedColor } from "@/lib/color/extract";
import type {
  BirdDetail,
  BirdSummary,
  DesignerModeData,
  SimilarBirdData,
} from "@/types/bird";

export type RawBirdLike = {
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
  characterTags?: string[];
  paletteColors: {
    hex: string;
    rgb: string;
    dominancePct: number;
    colorName: string;
    sortOrder: number;
  }[];
  designerModes?: DesignerModeData[];
  paletteVariations?: {
    name: string;
    rank: number;
    primaryHex: string;
    secondaryHex: string;
    accentHex: string;
    backgroundHex: string;
    foregroundHex: string;
  }[];
  accessibilityResults: {
    foreground: string;
    background: string;
    contrastRatio: number;
    levelAA: boolean;
    levelAAA: boolean;
    sortOrder: number;
    label?: string;
  }[];
  similar: { slug: string; similarityScore: number; rank: number }[];
};

let cache: RawBirdLike[] | null = null;

function load(): RawBirdLike[] {
  if (process.env.NODE_ENV === "production" && cache) return cache;
  const file = path.join(process.cwd(), "prisma", "seed", "dataset.json");
  const parsed = JSON.parse(readFileSync(file, "utf-8")) as {
    birds: RawBirdLike[];
  };
  if (process.env.NODE_ENV === "production") {
    cache = parsed.birds;
  }
  return parsed.birds;
}

function toExtracted(raw: RawBirdLike["paletteColors"]): ExtractedColor[] {
  return raw.map((c) => ({
    hex: c.hex,
    rgb: c.rgb,
    rgbValues: { r: 0, g: 0, b: 0 },
    dominancePct: c.dominancePct,
    colorName: c.colorName,
  }));
}

function hydrateMode(mode: DesignerModeData): DesignerModeData {
  const strategy = mode.strategy ?? {
    id: strategyForMode(mode.id).id,
    name: strategyForMode(mode.id).name,
    description: strategyForMode(mode.id).description,
    personality: strategyForMode(mode.id).personality,
  };
  const tokens = hydrateTokens(mode.curated as CuratedPalette, mode.id);
  return { ...mode, strategy, tokens };
}

function resolveDesignerModes(b: RawBirdLike): DesignerModeData[] {
  if (b.designerModes?.length) {
    return b.designerModes.map(hydrateMode);
  }
  return mapModes(buildDesignerModes(toExtracted(b.paletteColors)));
}

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

function resolveCharacterTags(b: RawBirdLike, modes: DesignerModeData[]): string[] {
  if (b.characterTags?.length) return b.characterTags;
  return inferCharacter(modes[0].curated);
}

function previewFromModes(modes: DesignerModeData[]): string[] {
  const t = modes[0].tokens;
  return [t.primary, t.accent, t.surface, t.border];
}

export function getDatasetBirds(): RawBirdLike[] {
  return load();
}

export function toSummary(b: RawBirdLike): BirdSummary {
  const modes = resolveDesignerModes(b);
  return {
    id: b.slug,
    slug: b.slug,
    name: b.name,
    scientificName: b.scientificName,
    thumbUrl: b.thumbUrl,
    imageUrl: b.imageUrl,
    colorTags: b.colorTags,
    characterTags: resolveCharacterTags(b, modes),
    palettePreview: previewFromModes(modes),
  };
}

export function toDetail(b: RawBirdLike, all: RawBirdLike[]): BirdDetail {
  const bySlug = new Map(all.map((x) => [x.slug, x]));
  const similar: SimilarBirdData[] = b.similar
    .map((s) => {
      const ref = bySlug.get(s.slug);
      if (!ref) return null;
      return {
        slug: ref.slug,
        name: ref.name,
        thumbUrl: ref.thumbUrl,
        imageUrl: ref.imageUrl,
      };
    })
    .filter((x): x is SimilarBirdData => x !== null)
    .slice(0, 6);

  const designerModes = resolveDesignerModes(b);
  const accessibilityResults = generateTokenPairings(
    designerModes[0].tokens,
  ).map((p, i) => ({ ...p, sortOrder: i }));

  return {
    id: b.slug,
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
    characterTags: resolveCharacterTags(b, designerModes),
    paletteColors: [...b.paletteColors].sort(
      (x, y) => x.sortOrder - y.sortOrder,
    ),
    designerModes: [...designerModes].sort((x, y) => x.rank - y.rank),
    accessibilityResults,
    similar,
  };
}
