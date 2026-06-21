import { cache } from "react";
import type { BirdSummary, DataManifest } from "@/types/bird";
import {
  getDatasetBirds,
  loadInitialPage,
  loadManifest,
  loadSearchIndex,
} from "./dataset";
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

export type HomeInitialData = {
  manifest: DataManifest;
  initialBirds: BirdSummary[];
};

export const getHomeInitialData = cache(async (): Promise<HomeInitialData> => {
  const manifest = loadManifest();
  if (manifest) {
    return { manifest, initialBirds: loadInitialPage() };
  }

  const all = await getBirds();
  return {
    manifest: {
      version: 1,
      total: all.length,
      pageSize: all.length,
      pageCount: 1,
      generatedAt: "",
    },
    initialBirds: all,
  };
});
