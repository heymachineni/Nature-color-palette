import { hexToRgb, rgbToHsl } from "./convert";

/**
 * Maps a hex color to a single human color family used for search tags and
 * chip labels. Deterministic — based purely on HSL thresholds.
 */
export function nameColor(hex: string): string {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));

  if (l <= 8) return "black";
  if (l >= 93 && s <= 12) return "white";
  if (s <= 10) {
    if (l >= 70) return "white";
    if (l <= 30) return "black";
    return "gray";
  }

  // Brown: warm hues that are dark/desaturated rather than vivid.
  const warm = h < 45 || h >= 350;
  if (warm && l < 45 && s < 75) return "brown";
  if (h >= 25 && h < 45 && l < 60 && s < 70) return "brown";

  if (h < 15 || h >= 345) return "red";
  if (h < 45) return "orange";
  if (h < 66) return "yellow";
  if (h < 160) return "green";
  if (h < 200) return "teal";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  if (h < 345) return "pink";
  return "red";
}

/** Search synonyms so "grey", "navy", "crimson" still match families. */
const SYNONYMS: Record<string, string> = {
  grey: "gray",
  silver: "gray",
  charcoal: "black",
  ivory: "white",
  cream: "white",
  navy: "blue",
  azure: "blue",
  cyan: "teal",
  turquoise: "teal",
  aqua: "teal",
  lime: "green",
  olive: "green",
  emerald: "green",
  crimson: "red",
  scarlet: "red",
  maroon: "red",
  ruby: "red",
  amber: "orange",
  gold: "yellow",
  golden: "yellow",
  violet: "purple",
  magenta: "pink",
  rose: "pink",
  tan: "brown",
  chestnut: "brown",
};

export function normalizeColorQuery(query: string): string {
  const q = query.trim().toLowerCase();
  return SYNONYMS[q] ?? q;
}

export const COLOR_FAMILIES = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "brown",
  "black",
  "gray",
  "white",
] as const;
