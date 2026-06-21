import type { BirdIndexEntry, BirdSummary } from "@/types/bird";
import { hasBirdImage } from "@/lib/photos/placeholder";

export function entriesToSummaries(entries: BirdIndexEntry[]): BirdSummary[] {
  const kept = entries.filter((e) => hasBirdImage(e.imageUrl ?? ""));
  const slugs = new Set(kept.map((e) => e.slug));

  return kept.map((e) => ({
    id: e.slug,
    slug: e.slug,
    name: e.name,
    scientificName: e.scientificName,
    region: e.region ?? "",
    imageUrl: e.imageUrl ?? "",
    colorFamilies: e.colorFamilies,
    preview: e.preview?.length ? e.preview : ["#64748B"],
    palette: e.palette?.length ? e.palette : [{ hex: "#64748B", share: 100 }],
    colors: e.colors ?? [],
    similar: (e.similar ?? []).filter((s) => slugs.has(s)),
  }));
}

export async function fetchBirdPage(page: number): Promise<BirdSummary[]> {
  const res = await fetch(`/data/pages/page-${page}.json`);
  if (!res.ok) throw new Error(`Failed to load page ${page}`);
  return res.json() as Promise<BirdSummary[]>;
}

let searchIndexPromise: Promise<BirdSummary[]> | null = null;

export function fetchSearchIndex(): Promise<BirdSummary[]> {
  if (!searchIndexPromise) {
    searchIndexPromise = fetch("/data/search-index.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load search index");
        return res.json() as Promise<BirdIndexEntry[]>;
      })
      .then(entriesToSummaries)
      .catch((err) => {
        searchIndexPromise = null;
        throw err;
      });
  }
  return searchIndexPromise;
}
