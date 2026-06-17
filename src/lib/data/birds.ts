import { cache } from "react";
import type { BirdDetail, BirdSummary } from "@/types/bird";
import { getDatasetBirds, loadSearchIndex, toDetail, toSummary } from "./dataset";
import { isFirestoreConfigured } from "@/lib/firebase/admin";

/**
 * Bird data: Firestore (dev/build) or dataset.json (production static export).
 */
const useFirestore =
  isFirestoreConfigured() && process.env.USE_JSON_DATA !== "true";

export const getBirds = cache(async (): Promise<BirdSummary[]> => {
  if (useFirestore) {
    const { getFirestoreBirds } = await import("./firestore");
    return getFirestoreBirds();
  }

  const fromIndex = loadSearchIndex();
  return fromIndex.sort((a, b) => a.name.localeCompare(b.name));
});

export const getBirdBySlug = cache(
  async (slug: string): Promise<BirdDetail | null> => {
    if (useFirestore) {
      const { getFirestoreBirdBySlug } = await import("./firestore");
      return getFirestoreBirdBySlug(slug);
    }

    const all = getDatasetBirds();
    const bird = all.find((b) => b.slug === slug);
    return bird ? toDetail(bird, all) : null;
  },
);

export const getBirdSlugs = cache((): string[] => {
  const fromIndex = loadSearchIndex();
  if (fromIndex.length > 0) {
    return fromIndex.map((b) => b.slug);
  }
  return getDatasetBirds().map((b) => b.slug);
});
