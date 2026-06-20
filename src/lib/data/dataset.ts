import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  buildThemeFromPlumage,
  colorFamiliesFrom,
  filterPlumageColors,
  passesWcagAA,
} from "@/lib/color/plumage";
import { nameColor } from "@/lib/color/naming";
import type { ExtractedColor } from "@/lib/color/extract";
import type {
  BirdDetail,
  BirdSummary,
  BirdIndexEntry,
  DataManifest,
  ThemeTokensData,
  PlumageColorData,
} from "@/types/bird";
import { entriesToSummaries } from "./client-birds";
import { filterBirdsWithPhotos } from "@/lib/photos/placeholder";

export type RawBirdRecord = {
  slug: string;
  name: string;
  scientificName: string;
  region: string;
  imageUrl: string;
  colors: PlumageColorData[];
  colorFamilies: string[];
  theme: ThemeTokensData;
  wcagAA: boolean;
  similar: { slug: string; rank: number }[];
};

/** v1 Firestore / dataset shape (pre-redesign). */
type LegacyBirdRecord = {
  slug: string;
  name: string;
  scientificName: string;
  region?: string;
  imageUrl: string;
  colors?: PlumageColorData[];
  colorFamilies?: string[];
  colorTags?: string[];
  theme?: ThemeTokensData;
  wcagAA?: boolean;
  similar?: { slug: string; rank: number; similarityScore?: number }[];
  paletteColors?: {
    hex: string;
    rgb?: string;
    dominancePct: number;
    colorName?: string;
  }[];
  designerModes?: {
    tokens?: ThemeTokensData & {
      primary?: string;
      accent?: string;
      background?: string;
      surface?: string;
      textPrimary?: string;
      textSecondary?: string;
      border?: string;
    };
    curated?: {
      hero: { uiHex?: string; natureHex: string; label?: string };
      support: { uiHex?: string; natureHex: string; label?: string };
      accent: { uiHex?: string; natureHex: string; label?: string };
      neutral?: { uiHex?: string; natureHex: string; label?: string };
    };
  }[];
};

let cache: RawBirdRecord[] | null = null;

function toExtracted(
  palette: NonNullable<LegacyBirdRecord["paletteColors"]>,
): ExtractedColor[] {
  return palette.map((c) => ({
    hex: c.hex,
    rgb: c.rgb ?? "",
    rgbValues: { r: 0, g: 0, b: 0 },
    dominancePct: c.dominancePct,
    colorName: c.colorName ?? nameColor(c.hex),
  }));
}

function themeFromLegacyTokens(
  tokens: NonNullable<LegacyBirdRecord["designerModes"]>[0]["tokens"],
): ThemeTokensData | null {
  if (!tokens?.primary) return null;
  return {
    primary: tokens.primary,
    accent: tokens.accent ?? tokens.primary,
    background: tokens.background ?? "#F7F8FA",
    surface: tokens.surface ?? "#FFFFFF",
    text: tokens.textPrimary ?? "#1A1A1A",
    textMuted: tokens.textSecondary ?? "#6B7280",
    border: tokens.border ?? "#E5E7EB",
  };
}

function colorsFromLegacyCurated(
  curated: NonNullable<
    NonNullable<LegacyBirdRecord["designerModes"]>[0]["curated"]
  >,
): PlumageColorData[] {
  const roles = [
    { key: "hero" as const, label: "Signature" },
    { key: "support" as const, label: "Body" },
    { key: "accent" as const, label: "Accent" },
  ];
  const out: PlumageColorData[] = [];
  for (const { key } of roles) {
    const c = curated[key];
    if (!c) continue;
    const hex = c.uiHex ?? c.natureHex;
    const family = nameColor(c.natureHex);
    if (family === "gray" || family === "white") continue;
    if (out.some((x) => x.family === family)) continue;
    out.push({ hex, family, share: key === "support" ? 40 : 25 });
  }
  return out;
}

/** Accept legacy bird documents (e.g. stale Firestore). */
export function normalizeBirdRecord(raw: LegacyBirdRecord): RawBirdRecord {
  if (Array.isArray(raw.colors) && raw.colors.length > 0 && raw.theme) {
    return {
      slug: raw.slug,
      name: raw.name,
      scientificName: raw.scientificName,
      region: raw.region ?? "",
      imageUrl: raw.imageUrl,
      colors: raw.colors,
      colorFamilies: raw.colorFamilies ?? colorFamiliesFrom(raw.colors),
      theme: raw.theme,
      wcagAA: raw.wcagAA ?? passesWcagAA(raw.theme),
      similar: (raw.similar ?? []).map((s) => ({
        slug: s.slug,
        rank: s.rank,
      })),
    };
  }

  let colors: PlumageColorData[] = [];

  if (raw.paletteColors?.length) {
    colors = filterPlumageColors(toExtracted(raw.paletteColors));
  } else if (raw.designerModes?.[0]?.curated) {
    colors = colorsFromLegacyCurated(raw.designerModes[0].curated);
  }

  const theme =
    raw.theme ??
    themeFromLegacyTokens(raw.designerModes?.[0]?.tokens) ??
    buildThemeFromPlumage(colors);

  const colorFamilies =
    raw.colorFamilies ??
    (colors.length ? colorFamiliesFrom(colors) : (raw.colorTags ?? []));

  return {
    slug: raw.slug,
    name: raw.name,
    scientificName: raw.scientificName,
    region: raw.region ?? "",
    imageUrl: raw.imageUrl,
    colors,
    colorFamilies,
    theme,
    wcagAA: raw.wcagAA ?? passesWcagAA(theme),
    similar: (raw.similar ?? []).map((s) => ({
      slug: s.slug,
      rank: s.rank,
    })),
  };
}

function load(): RawBirdRecord[] {
  if (process.env.NODE_ENV === "production" && cache) return cache;
  const file = path.join(process.cwd(), "prisma", "seed", "dataset.json");
  const parsed = JSON.parse(readFileSync(file, "utf-8")) as {
    birds: LegacyBirdRecord[];
  };
  const birds = filterBirdsWithPhotos(parsed.birds.map(normalizeBirdRecord));
  if (process.env.NODE_ENV === "production") {
    cache = birds;
  }
  return birds;
}

export function getDatasetBirds(): RawBirdRecord[] {
  return load();
}

export function toSummary(b: RawBirdRecord): BirdSummary {
  const colors = b.colors ?? [];
  const preview = colors.slice(0, 4).map((c) => c.hex);
  const palette = colors.map((c) => ({ hex: c.hex, share: c.share }));
  return {
    id: b.slug,
    slug: b.slug,
    name: b.name,
    scientificName: b.scientificName,
    region: b.region,
    imageUrl: b.imageUrl,
    colorFamilies: b.colorFamilies ?? [],
    preview: preview.length ? preview : ["#64748B"],
    palette: palette.length ? palette : [{ hex: "#64748B", share: 100 }],
    colors,
    similar: (b.similar ?? []).map((s) => s.slug),
  };
}

export function toDetail(b: RawBirdRecord, _all: RawBirdRecord[]): BirdDetail {
  void _all;
  const theme = b.theme ?? buildThemeFromPlumage(b.colors ?? []);
  return {
    ...toSummary(b),
    theme,
    wcagAA: b.wcagAA ?? passesWcagAA(theme),
  };
}

function readSearchIndexEntries(): BirdIndexEntry[] | null {
  for (const name of ["search-index.json", "index.json"]) {
    const file = path.join(process.cwd(), "public", "data", name);
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, "utf-8")) as BirdIndexEntry[];
    }
  }
  return null;
}

/** Client search index (also generated at ingest). */
export function loadSearchIndex(): BirdSummary[] {
  const entries = readSearchIndexEntries();
  if (entries) return entriesToSummaries(entries);
  return getDatasetBirds().map(toSummary);
}

export function loadManifest(): DataManifest | null {
  const file = path.join(process.cwd(), "public", "data", "manifest.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf-8")) as DataManifest;
}

export function loadInitialPage(): BirdSummary[] {
  const pageFile = path.join(
    process.cwd(),
    "public",
    "data",
    "pages",
    "page-1.json",
  );
  if (existsSync(pageFile)) {
    return JSON.parse(readFileSync(pageFile, "utf-8")) as BirdSummary[];
  }
  return loadSearchIndex().slice(0, 120);
}
