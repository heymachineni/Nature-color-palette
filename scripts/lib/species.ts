import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadSpeciesFromBirdnetCsv } from "./birdnet";
import { slugFromScientificName } from "./slug";

export type SpeciesInput = {
  slug: string;
  name: string;
  scientificName: string;
  region: string;
  imageUrl?: string;
};

const DATASET = path.join(process.cwd(), "prisma", "seed", "dataset.json");

/** Load species from existing dataset.json (default) or BirdNET taxonomy CSV. */
export async function loadSpecies(opts: {
  fromTaxonomy?: boolean;
  limit?: number;
}): Promise<SpeciesInput[]> {
  let species: SpeciesInput[];

  if (opts.fromTaxonomy) {
    const rows = await loadSpeciesFromBirdnetCsv();
    species = rows
      .map((row) => {
        const slug = slugFromScientificName(row.scientificName);
        if (!slug) return null;
        return {
          slug,
          name: row.commonName,
          scientificName: row.scientificName,
          region: row.region,
        };
      })
      .filter((s): s is SpeciesInput => Boolean(s));
  } else {
    const { birds } = JSON.parse(await readFile(DATASET, "utf-8")) as {
      birds: SpeciesInput[];
    };
    species = birds.map((b) => ({
      slug: b.slug,
      name: b.name,
      scientificName: b.scientificName,
      region: b.region,
      imageUrl: b.imageUrl,
    }));
  }

  if (opts.limit && opts.limit > 0) {
    species = species.slice(0, opts.limit);
  }

  return species;
}
