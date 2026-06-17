import { parseCsv } from "./csv";
import { parseHbwColorGroups, type HbwColorGroup } from "../../src/lib/color/hbw-plumage";
import { readText } from "./paths";

export async function loadHbwColorGroups(
  colorGroupsPath: string,
): Promise<HbwColorGroup[]> {
  const text = await readText(colorGroupsPath);
  const rows = parseCsv(text);
  return parseHbwColorGroups(rows);
}

export type HbwIllustration = {
  illustrationId: string;
  commonName: string;
  scientificName: string;
  subspecies: string;
  sex: string;
  age: string;
  morph: string;
  order: string;
  family: string;
  group: string;
  proportions: number[];
  score: number;
};

const PROP_KEYS = Array.from({ length: 24 }, (_, i) => `color${i + 1}`);

function norm(value: string): string {
  return value.trim().toLowerCase();
}

function illustrationScore(row: Record<string, string>): number {
  let score = 0;
  const sex = norm(row.Sex ?? row.sex ?? "");
  const age = norm(row.Age ?? row.age ?? "");
  const morph = norm(row.Morph ?? row.morph ?? "");
  const sub = norm(row.Subspecies ?? row.subspecies ?? "");

  if (sex === "male") score += 40;
  else if (sex === "monomorphic") score += 25;
  else if (sex === "female") score += 10;

  if (age === "adult" || age === "not specified") score += 20;
  else if (age.includes("juvenile")) score -= 10;

  if (morph === "none" || morph === "na") score += 15;

  if (
    sub === "na" ||
    sub.includes("nominate") ||
    sub === "" ||
    sub === "none"
  ) {
    score += 10;
  }

  return score;
}

function proportionsFromRow(row: Record<string, string>): number[] {
  return PROP_KEYS.map((key) => {
    const alt =
      row[key] ??
      row[key.charAt(0).toUpperCase() + key.slice(1)] ??
      row[`Color${key.slice(5)}`];
    const n = Number(alt);
    return Number.isFinite(n) ? n : 0;
  });
}

export async function loadHbwIllustrations(
  proportionsPath: string,
): Promise<HbwIllustration[]> {
  const text = await readText(proportionsPath);
  const rows = parseCsv(text);

  return rows.map((row) => {
    const proportions = proportionsFromRow(row);
    return {
      illustrationId: (row.Illustration_id ?? row.illustration_id ?? "").trim(),
      commonName: (row.Com_name ?? row.com_name ?? "").trim(),
      scientificName: (row.Sci_name ?? row.sci_name ?? "").trim(),
      subspecies: (row.Subspecies ?? row.subspecies ?? "").trim(),
      sex: (row.Sex ?? row.sex ?? "").trim(),
      age: (row.Age ?? row.age ?? "").trim(),
      morph: (row.Morph ?? row.morph ?? "").trim(),
      order: (row.Order ?? row.order ?? "").trim(),
      family: (row.Family ?? row.family ?? "").trim(),
      group: (row.Group ?? row.group ?? "").trim(),
      proportions,
      score: illustrationScore(row),
    };
  });
}

/** One best illustration per species (Sci_name). */
export function pickSpeciesIllustrations(
  illustrations: HbwIllustration[],
): HbwIllustration[] {
  const bySpecies = new Map<string, HbwIllustration>();

  for (const ill of illustrations) {
    const key = ill.scientificName.trim().toLowerCase();
    if (!key) continue;
    const prev = bySpecies.get(key);
    if (!prev || ill.score > prev.score) {
      bySpecies.set(key, ill);
    }
  }

  return [...bySpecies.values()].sort((a, b) =>
    a.commonName.localeCompare(b.commonName),
  );
}

/** Drop species that share the same common name (keep best-scored illustration). */
export function dedupeByCommonName(illustrations: HbwIllustration[]): {
  list: HbwIllustration[];
  removed: number;
} {
  const byName = new Map<string, HbwIllustration>();
  let removed = 0;

  for (const ill of illustrations) {
    const key = ill.commonName.trim().toLowerCase();
    if (!key) continue;
    const prev = byName.get(key);
    if (!prev || ill.score > prev.score) {
      if (prev) removed++;
      byName.set(key, ill);
    } else {
      removed++;
    }
  }

  return {
    list: [...byName.values()].sort((a, b) =>
      a.commonName.localeCompare(b.commonName),
    ),
    removed,
  };
}

export function slugFromScientificName(scientificName: string): string {
  return scientificName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
