import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from "./convert";
import { bestTextOn } from "./accessibility";
import { colorDistance, type ExtractedColor } from "./extract";

export type PaletteVariationData = {
  name: string;
  rank: number;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  backgroundHex: string;
  foregroundHex: string;
};

function saturation(hex: string): number {
  return rgbToHsl(hexToRgb(hex)).s;
}
function lightness(hex: string): number {
  return rgbToHsl(hexToRgb(hex)).l;
}

/** Light surface carrying a hint of the bird's primary hue. */
function deriveBackground(primaryHex: string, palette: ExtractedColor[]): string {
  const existingLight = palette.find((c) => lightness(c.hex) >= 90);
  if (existingLight) return existingLight.hex;
  const { h } = rgbToHsl(hexToRgb(primaryHex));
  return rgbToHex(hslToRgb({ h, s: 14, l: 97 }));
}

/** Dark, legible ink derived from the palette or primary hue. */
function deriveForeground(backgroundHex: string, palette: ExtractedColor[]): string {
  const dark = [...palette]
    .filter((c) => lightness(c.hex) < 34)
    .sort((a, b) => lightness(a.hex) - lightness(b.hex))[0];
  if (dark) return dark.hex;
  return bestTextOn(backgroundHex);
}

/** Minimum saturation for a color to lead its own palette. */
const LEAD_SATURATION = 36;

/**
 * Builds design-ready 60 / 30 / 10 palettes from an extracted palette.
 *
 * The **primary** is the bird's signature color — the most saturated of its
 * prominent colors — not merely the most pixel-dominant tone (which is often a
 * muddy neutral). Supporting tones become secondary and accent. A bird with
 * several genuinely distinct strong hues offers a few directions to try; a
 * neutral bird gets a single, calm palette.
 */
export function buildVariations(palette: ExtractedColor[]): PaletteVariationData[] {
  if (palette.length === 0) return [];

  const prominent = palette.filter((c) => c.dominancePct >= 4);
  const pool = prominent.length > 0 ? prominent : palette;

  // Eligible signature colors: saturated enough to read as a hue, and not
  // near-black / near-white (whose HSL saturation is unreliable).
  const eligible = pool.filter((c) => {
    const l = lightness(c.hex);
    return l >= 22 && l <= 82 && saturation(c.hex) >= LEAD_SATURATION;
  });
  // Rank by vibrancy = presence × saturation, so the primary is a *prominent*
  // signature color (deep blue jay blue) rather than a rare hyper-bright fleck.
  const ranked = [...eligible].sort(
    (a, b) =>
      b.dominancePct * saturation(b.hex) - a.dominancePct * saturation(a.hex),
  );
  const leads: ExtractedColor[] = [];
  for (const color of ranked) {
    if (leads.every((lead) => colorDistance(lead.hex, color.hex) > 26)) {
      leads.push(color);
    }
    if (leads.length >= 3) break;
  }

  // Neutral bird (no strong hue): lead with the most dominant color.
  if (leads.length === 0) leads.push(palette[0]);

  return leads.map((lead, index) => {
    const others = palette.filter((c) => c.hex !== lead.hex);

    // Secondary: the most dominant supporting tone, clearly different.
    const secondary =
      others.find((c) => colorDistance(c.hex, lead.hex) > 18) ??
      others[0] ??
      lead;

    // Accent: the most vivid remaining color, distinct from both.
    const accent =
      [...others]
        .filter(
          (c) =>
            colorDistance(c.hex, lead.hex) > 18 &&
            colorDistance(c.hex, secondary.hex) > 12,
        )
        .sort((a, b) => saturation(b.hex) - saturation(a.hex))[0] ??
      others.find((c) => c.hex !== secondary.hex) ??
      secondary;

    const backgroundHex = deriveBackground(lead.hex, palette);
    const foregroundHex = deriveForeground(backgroundHex, palette);

    return {
      name: leads.length > 1 ? `Palette ${index + 1}` : "Palette",
      rank: index,
      primaryHex: lead.hex,
      secondaryHex: secondary.hex,
      accentHex: accent.hex,
      backgroundHex,
      foregroundHex,
    };
  });
}
