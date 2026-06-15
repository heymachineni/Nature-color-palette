import type { BirdSummary } from "@/types/bird";
import { normalizeColorQuery } from "@/lib/color/naming";

/**
 * Filters birds by name, scientific name, or color family. Color search is
 * synonym-aware, so "crimson" matches red birds and "navy" matches blue ones.
 */
export function filterBirds(
  birds: BirdSummary[],
  query: string,
): BirdSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return birds;
  const color = normalizeColorQuery(q);

  return birds.filter((bird) => {
    if (bird.name.toLowerCase().includes(q)) return true;
    if (bird.scientificName.toLowerCase().includes(q)) return true;
    return bird.colorTags.some(
      (tag) => tag.includes(color) || color.includes(tag) || tag.includes(q),
    ) || bird.characterTags.some((tag) => tag.includes(q));
  });
}
