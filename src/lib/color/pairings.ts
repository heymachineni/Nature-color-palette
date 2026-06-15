import { wcagLevels } from "./accessibility";
import type { ExtractedColor } from "./extract";

export type AccessibilityPairing = {
  foreground: string;
  background: string;
  contrastRatio: number;
  levelAA: boolean;
  levelAAA: boolean;
  sortOrder: number;
};

/**
 * Generates accessible foreground/background pairings from a palette.
 * Considers palette-on-palette plus black/white text, keeps only AA-passing
 * pairs, and returns the strongest, most distinct combinations.
 */
export function generatePairings(
  palette: ExtractedColor[],
  limit = 6,
): AccessibilityPairing[] {
  const swatches = palette.map((c) => c.hex);
  const foregrounds = Array.from(new Set([...swatches, "#FFFFFF", "#111111"]));

  const found: Omit<AccessibilityPairing, "sortOrder">[] = [];
  const seen = new Set<string>();

  for (const background of swatches) {
    for (const foreground of foregrounds) {
      if (foreground === background) continue;
      const key = `${foreground}->${background}`;
      if (seen.has(key)) continue;
      const { contrastRatio, levelAA, levelAAA } = wcagLevels(
        foreground,
        background,
      );
      if (!levelAA) continue;
      seen.add(key);
      found.push({ foreground, background, contrastRatio, levelAA, levelAAA });
    }
  }

  // Prefer one strong pairing per background, AAA first, then highest contrast.
  const byBackground = new Map<string, Omit<AccessibilityPairing, "sortOrder">>();
  for (const pair of found.sort(
    (a, b) =>
      Number(b.levelAAA) - Number(a.levelAAA) ||
      b.contrastRatio - a.contrastRatio,
  )) {
    if (!byBackground.has(pair.background)) byBackground.set(pair.background, pair);
  }

  const ranked = Array.from(byBackground.values()).sort(
    (a, b) =>
      Number(b.levelAAA) - Number(a.levelAAA) ||
      b.contrastRatio - a.contrastRatio,
  );

  return ranked.slice(0, limit).map((pair, i) => ({ ...pair, sortOrder: i }));
}
