import { extractPalette, colorDistance, type ExtractedColor } from "./extract";
import { nameColor } from "./naming";
import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl, mix } from "./convert";
import { toUiSafe } from "./ui-safe";
import { bestTextOn, contrastRatio } from "./accessibility";

export type PlumageColor = {
  hex: string;
  family: string;
  share: number;
};

export type ThemeTokens = {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
};

const NEUTRAL_FAMILIES = new Set(["black", "gray", "white"]);
const MIN_CHROMATIC_SHARE = 5;
const MIN_NEUTRAL_SHARE = 12;
const MAX_PLUMAGE = 6;
const MIN_PLUMAGE = 2;

function saturation(hex: string): number {
  return rgbToHsl(hexToRgb(hex)).s;
}

function lightness(hex: string): number {
  return rgbToHsl(hexToRgb(hex)).l;
}

function isShadowArtifact(c: ExtractedColor): boolean {
  const s = saturation(c.hex);
  const l = lightness(c.hex);
  return l < 12 && s < 15 && c.dominancePct < 20;
}

function keepNeutral(
  c: ExtractedColor,
  family: string,
  expected?: string[],
): boolean {
  const expectedSet = expected?.map((x) => x.toLowerCase()) ?? [];
  if (expectedSet.includes(family)) return c.dominancePct >= 3;
  return c.dominancePct >= MIN_NEUTRAL_SHARE;
}

function toPlumage(c: ExtractedColor): PlumageColor {
  const family = nameColor(c.hex);
  return {
    hex: NEUTRAL_FAMILIES.has(family) ? c.hex : toUiSafe(c.hex, "hero"),
    family,
    share: Math.round(c.dominancePct),
  };
}

function dedupePlumage(colors: PlumageColor[]): PlumageColor[] {
  const byFamily = new Map<string, PlumageColor>();
  for (const c of colors) {
    const prev = byFamily.get(c.family);
    if (!prev || c.share > prev.share) byFamily.set(c.family, c);
  }

  const perceptual: PlumageColor[] = [];
  for (const c of [...byFamily.values()].sort((a, b) => b.share - a.share)) {
    const dup = perceptual.find((d) => colorDistance(d.hex, c.hex) < 12);
    if (dup) {
      if (c.share > dup.share) {
        dup.hex = c.hex;
        dup.share = c.share;
        dup.family = c.family;
      }
    } else {
      perceptual.push({ ...c });
    }
  }

  return perceptual
    .sort((a, b) => b.share - a.share)
    .slice(0, MAX_PLUMAGE);
}

function keepChromatic(
  c: ExtractedColor,
  family: string,
  expected?: string[],
): boolean {
  const expectedSet = expected?.map((x) => x.toLowerCase()) ?? [];
  if (expectedSet.includes(family)) return c.dominancePct >= 3;
  return c.dominancePct >= MIN_CHROMATIC_SHARE && saturation(c.hex) >= 18;
}

/**
 * Keep only colors that belong to plumage — no invented neutrals.
 * Neutrals appear only when they genuinely dominate the bird (crow, snow owl).
 */
export function filterPlumageColors(
  raw: ExtractedColor[],
  expectedColors?: string[],
): PlumageColor[] {
  const kept: PlumageColor[] = [];

  for (const c of raw) {
    if (isShadowArtifact(c)) continue;

    const family = nameColor(c.hex);
    const isNeutral = NEUTRAL_FAMILIES.has(family);
    const ok = isNeutral
      ? keepNeutral(c, family, expectedColors)
      : keepChromatic(c, family, expectedColors);

    if (!ok) continue;

    kept.push(toPlumage(c));
  }

  let result = dedupePlumage(kept);

  if (result.length < MIN_PLUMAGE && raw.length >= MIN_PLUMAGE) {
    result = dedupePlumage(
      raw.filter((c) => !isShadowArtifact(c)).map(toPlumage),
    );
  }

  if (result.length === 0 && raw.length > 0) {
    result = [toPlumage(raw[0])];
  }

  return result;
}

function vividScore(c: PlumageColor): number {
  return saturation(c.hex) * (0.4 + c.share / 100);
}

/** UI theme derived from plumage — neutrals are generated, not bird colors. */
export function buildThemeFromPlumage(colors: PlumageColor[]): ThemeTokens {
  if (colors.length === 0) {
    return {
      primary: "#2563EB",
      accent: "#2563EB",
      background: "#F7F8FA",
      surface: "#FFFFFF",
      text: "#1A1A1A",
      textMuted: "#6B7280",
      border: "#E5E7EB",
    };
  }

  const ranked = [...colors].sort((a, b) => vividScore(b) - vividScore(a));
  const primary = ranked[0].hex;

  const accent =
    ranked.find(
      (c) =>
        c.hex !== primary &&
        colorDistance(c.hex, primary) > 20 &&
        saturation(c.hex) >= 25,
    )?.hex ?? ranked[1]?.hex ?? primary;

  const { h } = rgbToHsl(hexToRgb(primary));
  const background = rgbToHex(hslToRgb({ h, s: 8, l: 97 }));
  const surface = "#FFFFFF";
  const text = rgbToHex(hslToRgb({ h: 24, s: 10, l: 12 }));
  const textMuted = mix(text, background, 0.45);
  const border = mix(background, text, 0.12);

  return { primary, accent, background, surface, text, textMuted, border };
}

export function colorFamiliesFrom(colors: PlumageColor[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of colors) {
    if (!seen.has(c.family)) {
      seen.add(c.family);
      out.push(c.family);
    }
  }
  return out;
}

export function previewHexes(colors: PlumageColor[], max = 4): string[] {
  return colors.slice(0, max).map((c) => c.hex);
}

export function passesWcagAA(theme: ThemeTokens): boolean {
  const onBg = contrastRatio(theme.text, theme.background);
  const primaryOnBg = contrastRatio(theme.primary, theme.background);
  const btnText = bestTextOn(theme.primary);
  const onPrimary = contrastRatio(btnText, theme.primary);
  return onBg >= 4.5 && (primaryOnBg >= 3 || onPrimary >= 4.5);
}

export type ExtractPlumageOptions = {
  expectedColors?: string[];
  width?: number;
  height?: number;
};

/** Extract plumage colors from raw RGBA pixel buffer (post background removal). */
export function extractPlumageFromPixels(
  data: Uint8Array | Uint8ClampedArray | Buffer,
  width: number,
  height: number,
  options: ExtractPlumageOptions = {},
): PlumageColor[] {
  const raw = extractPalette(data, width, height, {
    centerWeight: false,
    backgroundSubtraction: false,
    saturationBoost: 0,
    alphaThreshold: 210,
    signatureColors: true,
    maxColors: 24,
  });

  if (raw.length === 0) return [];

  let filtered = filterPlumageColors(raw, options.expectedColors);

  // Second pass if expected families are missing from image extraction.
  if (options.expectedColors?.length) {
    const found = new Set(filtered.map((c) => c.family));
    const missing = options.expectedColors.filter((f) => !found.has(f));
    if (missing.length > 0) {
      const boosted = extractPalette(data, width, height, {
        centerWeight: false,
        backgroundSubtraction: false,
        saturationBoost: 2,
        alphaThreshold: 180,
        signatureColors: true,
        maxColors: 24,
      });
      const extra = filterPlumageColors(boosted, options.expectedColors);
      for (const c of extra) {
        if (!filtered.some((f) => f.family === c.family)) {
          filtered.push(c);
        }
      }
      filtered.sort((a, b) => b.share - a.share);
      filtered = dedupePlumage(filtered);
    }
  }

  return filtered;
}
