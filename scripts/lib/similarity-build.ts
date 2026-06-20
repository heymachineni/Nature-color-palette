import { rankSimilarBirds } from "../../src/lib/color/similarity";
import type { BirdRecord } from "../bird-record";

const MAX_SIMILARITY_CANDIDATES = 250;

function capSimilarityPool<T>(pool: T[], max: number): T[] {
  if (pool.length <= max) return pool;
  const step = pool.length / max;
  const capped: T[] = [];
  for (let k = 0; k < max; k++) {
    capped.push(pool[Math.floor(k * step)]);
  }
  return capped;
}

export function withSimilarity(birds: BirdRecord[]): BirdRecord[] {
  const index = birds.map((b) => ({
    id: b.slug,
    palette: b.colors.map((c) => c.hex),
    families: b.colorFamilies,
  }));

  const byFamily = new Map<string, number[]>();
  for (let i = 0; i < index.length; i++) {
    for (const f of index[i].families) {
      const list = byFamily.get(f) ?? [];
      list.push(i);
      byFamily.set(f, list);
    }
  }

  console.log("Computing similar birds…");
  for (let i = 0; i < birds.length; i++) {
    const target = index[i];
    const candidateIdx = new Set<number>();
    for (const f of target.families) {
      for (const j of byFamily.get(f) ?? []) {
        if (j !== i) candidateIdx.add(j);
      }
    }

    const rawPool =
      candidateIdx.size > 0
        ? [...candidateIdx].map((j) => index[j])
        : index.filter((_, j) => j !== i);

    const pool = capSimilarityPool(rawPool, MAX_SIMILARITY_CANDIDATES);
    const ranked = rankSimilarBirds(target, pool, 8);
    birds[i].similar = ranked.slice(0, 4).map((r) => ({
      slug: r.birdId,
      rank: r.rank,
    }));

    if ((i + 1) % 200 === 0 || i + 1 === birds.length) {
      process.stdout.write(`\r  Similarity ${i + 1}/${birds.length}`);
    }
  }
  process.stdout.write("\n");
  return birds;
}
