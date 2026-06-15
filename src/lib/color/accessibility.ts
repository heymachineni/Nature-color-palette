import { hexToRgb, type RGB } from "./convert";

function channelLuminance(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance({ r, g, b }: RGB): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** WCAG 2.1 contrast ratio between two hex colors. Returns a value 1–21. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type WcagLevels = {
  contrastRatio: number;
  levelAA: boolean;
  levelAAA: boolean;
};

/** Levels for normal body text (AA >= 4.5, AAA >= 7). */
export function wcagLevels(foreground: string, background: string): WcagLevels {
  const ratio = contrastRatio(foreground, background);
  return {
    contrastRatio: round2(ratio),
    levelAA: ratio >= 4.5,
    levelAAA: ratio >= 7,
  };
}

/** Pick black or white text for best contrast on a given background. */
export function bestTextOn(backgroundHex: string): string {
  const onBlack = contrastRatio(backgroundHex, "#000000");
  const onWhite = contrastRatio(backgroundHex, "#FFFFFF");
  return onBlack >= onWhite ? "#000000" : "#FFFFFF";
}
