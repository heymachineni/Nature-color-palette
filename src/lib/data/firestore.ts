import type { BirdDetail, BirdSummary } from "@/types/bird";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  normalizeBirdRecord,
  toDetail,
  toSummary,
  type RawBirdRecord,
} from "./dataset";

const COLLECTION = "birds";

async function loadAll(): Promise<RawBirdRecord[]> {
  const snap = await getAdminFirestore().collection(COLLECTION).get();
  return snap.docs.map((d) =>
    normalizeBirdRecord(d.data() as Parameters<typeof normalizeBirdRecord>[0]),
  );
}

export async function getFirestoreBirds(): Promise<BirdSummary[]> {
  const birds = await loadAll();
  return birds.map(toSummary).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFirestoreBirdBySlug(
  slug: string,
): Promise<BirdDetail | null> {
  const doc = await getAdminFirestore().collection(COLLECTION).doc(slug).get();
  if (!doc.exists) return null;
  const all = await loadAll();
  return toDetail(normalizeBirdRecord(doc.data() as Parameters<typeof normalizeBirdRecord>[0]), all);
}
