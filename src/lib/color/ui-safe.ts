import { clamp, hexToRgb, hslToRgb, mix, rgbToHex, rgbToHsl, type HSL } from "./convert";

function pct(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export type UiRole = "hero" | "support" | "accent" | "neutral";

/**
 * Transforms a vivid nature color into a UI-safe token.
 * Preserves hue and character; reduces neon chaos so palettes work in products.
 */
export function toUiSafe(hex: string, role: UiRole): string {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));

  let ui: HSL;
  switch (role) {
    case "hero":
      ui = { h, s: pct(s, 48, 82), l: pct(l, 38, 52) };
      break;
    case "support":
      ui = { h, s: pct(s * 0.55, 14, 42), l: pct(l, 42, 62) };
      break;
    case "accent":
      ui = { h, s: pct(s, 55, 88), l: pct(l, 42, 56) };
      break;
    case "neutral":
      ui = { h, s: pct(s * 0.25, 4, 16), l: pct(l < 70 ? 96 : l, 94, 98) };
      break;
  }
  return rgbToHex(hslToRgb(ui));
}

export function adjustLightness(hex: string, delta: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ ...hsl, l: clamp(hsl.l + delta, 8, 96) }));
}

/** Shift hue/sat/light for mode variants while keeping bird character. */
export function transformUi(
  hex: string,
  patch: Partial<HSL>,
): string {
  const base = rgbToHsl(hexToRgb(hex));
  return rgbToHex(
    hslToRgb({
      h: patch.h ?? base.h,
      s: patch.s ?? base.s,
      l: patch.l ?? base.l,
    }),
  );
}

export function slateFrom(hue: number): string {
  return rgbToHex(hslToRgb({ h: hue, s: 16, l: 52 }));
}

export function deepFrom(hex: string): string {
  const { h, s } = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ h, s: clamp(s * 0.7, 35, 55), l: 22 }));
}

export function silverFrom(_hex: string): string {
  return rgbToHex(hslToRgb({ h: 220, s: 8, l: 72 }));
}

export function offWhiteFrom(hex: string): string {
  const { h } = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ h, s: 10, l: 97 }));
}

export function mixUi(a: string, b: string, t: number): string {
  return mix(a, b, t);
}
