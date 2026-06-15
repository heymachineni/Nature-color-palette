/**
 * Curated seed list — 120+ visually striking birds with well-licensed
 * Wikipedia lead images and distinct color systems.
 *
 * `wikiTitle` is the exact English Wikipedia article title used to fetch the
 * description and lead image via the public REST + MediaWiki APIs.
 */
import {
  SEED_BIRDS_EXTENDED,
  SEED_BIRDS_ORIGINAL,
} from "./birds-catalog";

export type SeedBird = {
  slug: string;
  name: string;
  scientificName: string;
  region: string;
  habitat: string;
  wikiTitle: string;
  /**
   * Optional source-image override (direct Wikimedia upload URL). Used when a
   * Wikipedia lead image shows a drab/wrong individual (e.g. a female where the
   * species' striking plumage belongs to the male). Description still comes
   * from wikiTitle.
   */
  imageUrl?: string;
};

function dedupeBySlug(birds: SeedBird[]): SeedBird[] {
  const seen = new Set<string>();
  const out: SeedBird[] = [];
  for (const bird of birds) {
    if (seen.has(bird.slug)) continue;
    seen.add(bird.slug);
    out.push(bird);
  }
  return out;
}

export const SEED_BIRDS: SeedBird[] = dedupeBySlug([
  ...SEED_BIRDS_ORIGINAL,
  ...SEED_BIRDS_EXTENDED,
]);
