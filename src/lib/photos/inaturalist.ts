/**
 * Client-safe iNaturalist photo lookup (CORS-enabled API).
 */
export async function fetchInaturalistPhoto(
  scientificName: string,
  commonName?: string,
): Promise<string | null> {
  const exactSci = scientificName.trim();

  const byScience = await inaturalistTaxonPhoto(exactSci, exactSci);
  if (byScience) return byScience;

  if (commonName?.trim()) {
    const byCommon = await inaturalistTaxonPhoto(commonName.trim(), exactSci);
    if (byCommon) return byCommon;
  }

  return null;
}

async function inaturalistTaxonPhoto(
  query: string,
  expectedScientific: string,
): Promise<string | null> {
  const url = new URL("https://api.inaturalist.org/v1/taxa");
  url.searchParams.set("q", query);
  url.searchParams.set("rank", "species");
  url.searchParams.set("per_page", "5");
  url.searchParams.set("is_active", "true");

  const resp = await fetch(url);
  if (!resp.ok) return null;

  const data = (await resp.json()) as {
    results?: {
      name?: string;
      matched_term?: string;
      default_photo?: { medium_url?: string };
    }[];
  };

  const expected = expectedScientific.toLowerCase();
  const hit =
    data.results?.find((r) => r.name?.toLowerCase() === expected) ??
    data.results?.find((r) =>
      r.matched_term?.toLowerCase().includes(expected.split(" ")[0] ?? ""),
    );

  return hit?.default_photo?.medium_url ?? null;
}
