import type { BirdDetail, BirdSummary } from "@/types/bird";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { toDetail, toSummary, type RawBirdLike } from "./dataset";

const COLLECTION = "birds";

async function loadAll(): Promise<RawBirdLike[]> {
  const snap = await getAdminFirestore().collection(COLLECTION).get();
  return snap.docs.map((d) => d.data() as RawBirdLike);
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
  return toDetail(doc.data() as RawBirdLike, all);
}
