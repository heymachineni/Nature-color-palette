import { hexToRgb, rgbToHsl } from "./convert";
import type { CuratedPalette } from "./interpret";

function saturation(hex: string): number {
  const { s } = rgbToHsl(hexToRgb(hex));
  return s;
}

function lightness(hex: string): number {
  const { l } = rgbToHsl(hexToRgb(hex));
  return l;
}

/**
 * Emotional character tags — how designers discover and feel palettes,
 * not just what hue family they belong to.
 */
export function inferCharacter(curated: CuratedPalette): string[] {
  const { h, s, l } = rgbToHsl(hexToRgb(curated.hero.natureHex));
  const tags = new Set<string>();

  // Hue family → personality
  if (h < 25 || h >= 330) tags.add("bold");
  if (h < 25 || h >= 330) tags.add("energetic");
  if (h >= 25 && h < 55) tags.add("warm");
  if (h >= 25 && h < 55) tags.add("optimistic");
  if (h >= 55 && h < 85) tags.add("fresh");
  if (h >= 55 && h < 85) tags.add("friendly");
  if (h >= 170 && h < 220) tags.add("modern");
  if (h >= 170 && h < 220) tags.add("calm");
  if (h >= 220 && h < 280) tags.add("confident");
  if (h >= 220 && h < 280) tags.add("elegant");
  if (h >= 280 && h < 330) tags.add("playful");

  // Saturation & lightness modifiers
  if (s >= 65) tags.add("vivid");
  if (s >= 65 && (h < 30 || h > 330)) tags.add("tropical");
  if (l < 35) tags.add("dramatic");
  if (l > 70 && s < 40) tags.add("soft");
  if (saturation(curated.accent.natureHex) >= 55) tags.add("expressive");

  // Contrast character
  const heroL = lightness(curated.hero.natureHex);
  const accentL = lightness(curated.accent.natureHex);
  if (Math.abs(heroL - accentL) > 45) tags.add("high-contrast");

  if (s >= 50 && h >= 200 && h <= 250) tags.add("premium");

  return Array.from(tags).slice(0, 6);
}
