import { colorDistance } from "./extract";
import { nameColor } from "./naming";
import { rgbToHex } from "./convert";
import type { PlumageColor } from "./plumage";

export type HbwColorGroup = {
  id: number;
  label: string;
  hex: string;
};

const NEUTRAL_LABELS = new Set([
  "white",
  "background",
  "bg",
  "gray",
  "grey",
  "black",
]);

function familyFromHbwLabel(label: string, hex: string): string {
  const l = label.trim().toLowerCase();
  const fromLabel: Record<string, string> = {
    red: "red",
    brown: "brown",
    green: "green",
    blue: "blue",
    yellow: "yellow",
    gray: "gray",
    grey: "gray",
    black: "black",
    white: "white",
  };
  return fromLabel[l] ?? nameColor(hex);
}

const MIN_SHARE = 5;
const MAX_PLUMAGE = 6;

function isBackgroundGroup(label: string, hex: string): boolean {
  const l = label.trim().toLowerCase();
  if (NEUTRAL_LABELS.has(l)) return true;
  if (l.includes("white") || l.includes("background")) return true;
  const family = nameColor(hex);
  return family === "white" && l !== "cream";
}

function dedupePlumage(colors: PlumageColor[]): PlumageColor[] {
  const byFamily = new Map<string, PlumageColor>();
  for (const c of colors) {
    const prev = byFamily.get(c.family);
    if (!prev || c.share > prev.share) byFamily.set(c.family, c);
  }

  const perceptual: PlumageColor[] = [];
  for (const c of [...byFamily.values()].sort((a, b) => b.share - a.share)) {
    const dup = perceptual.find((d) => colorDistance(d.hex, c.hex) < 12);
    if (dup) {
      if (c.share > dup.share) {
        dup.hex = c.hex;
        dup.share = c.share;
        dup.family = c.family;
      }
    } else {
      perceptual.push({ ...c });
    }
  }

  return perceptual.sort((a, b) => b.share - a.share).slice(0, MAX_PLUMAGE);
}

/** Convert HBW color1–color24 proportions into app plumage colors. */
export function plumageFromHbwProportions(
  proportions: number[],
  groups: HbwColorGroup[],
): PlumageColor[] {
  const raw: PlumageColor[] = [];

  for (let i = 0; i < proportions.length; i++) {
    const share = Math.round(proportions[i] * 100);
    if (share < MIN_SHARE) continue;
    const group = groups[i];
    if (!group) continue;
    if (isBackgroundGroup(group.label, group.hex)) continue;

    const family = familyFromHbwLabel(group.label, group.hex);
    if (family === "white") continue;

    raw.push({
      hex: group.hex,
      family,
      share,
    });
  }

  const result = dedupePlumage(raw);
  if (result.length >= 2) return result;

  // Keep at least one chromatic tone if illustration is mostly neutral.
  for (let i = 0; i < proportions.length; i++) {
    const share = Math.round(proportions[i] * 100);
    if (share < 3) continue;
    const group = groups[i];
    if (!group) continue;
    const family = familyFromHbwLabel(group.label, group.hex);
    if (family === "white") continue;
    raw.push({
      hex: group.hex,
      family,
      share,
    });
  }

  return dedupePlumage(raw);
}

export function parseHbwColorGroups(rows: Record<string, string>[]): HbwColorGroup[] {
  const groups: (HbwColorGroup | undefined)[] = new Array(24);

  for (const row of rows) {
    const classId = (
      row["Color classification"] ??
      row.color_classification ??
      ""
    )
      .trim()
      .toLowerCase();
    const match = classId.match(/^color(\d{1,2})$/);
    if (!match) continue;

    const id = Number(match[1]);
    if (id < 1 || id > 24) continue;

    const r = Math.round(Number(row.R ?? row.r ?? 0));
    const g = Math.round(Number(row.G ?? row.g ?? 0));
    const b = Math.round(Number(row.B ?? row.b ?? 0));
    const label = (row.Colors ?? row.colors ?? classId).trim();

    groups[id - 1] = { id, label, hex: rgbToHex({ r, g, b }) };
  }

  return groups.map((g, i) =>
    g ?? { id: i + 1, label: `color${i + 1}`, hex: "#808080" },
  );
}
