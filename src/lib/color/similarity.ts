import { colorDistance } from "./extract";

/**
 * Palette similarity in [0,1]. For each color in A we find its nearest color in
 * B (and vice-versa), average those minimum CIEDE2000 distances, then normalize.
 * Higher = more visually similar.
 */
export function paletteSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  const minDistanceTo = (hex: string, set: string[]) =>
    Math.min(...set.map((other) => colorDistance(hex, other)));

  const aToB = a.map((hex) => minDistanceTo(hex, b));
  const bToA = b.map((hex) => minDistanceTo(hex, a));
  const avg =
    [...aToB, ...bToA].reduce((sum, d) => sum + d, 0) /
    (aToB.length + bToA.length);

  // ΔE ~30+ is clearly different; clamp and invert into a similarity score.
  return Math.max(0, 1 - avg / 30);
}

export type RankedSimilar = {
  birdId: string;
  similarityScore: number;
  rank: number;
};

export function rankSimilarBirds(
  target: { id: string; palette: string[] },
  others: { id: string; palette: string[] }[],
  count = 6,
): RankedSimilar[] {
  return others
    .filter((o) => o.id !== target.id)
    .map((o) => ({
      birdId: o.id,
      similarityScore: paletteSimilarity(target.palette, o.palette),
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, count)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}
