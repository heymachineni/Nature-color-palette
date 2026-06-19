import { nameColor } from "./naming";
import { rgbToHex } from "./convert";
import type { PlumageColor } from "./plumage";

export type HbwColorGroup = {
  id: number;
  label: string;
  hex: string;
};

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

/**
 * Convert HBW color1–color24 proportions into app plumage colors.
 * Shows EVERY color present in the dataset — no thresholds, no dedupe, no filtering.
 * A color is included whenever its proportion is greater than zero.
 */
export function plumageFromHbwProportions(
  proportions: number[],
  groups: HbwColorGroup[],
): PlumageColor[] {
  const colors: PlumageColor[] = [];

  for (let i = 0; i < proportions.length; i++) {
    const proportion = proportions[i];
    if (!(proportion > 0)) continue;

    const group = groups[i];
    if (!group) continue;

    colors.push({
      hex: group.hex,
      family: familyFromHbwLabel(group.label, group.hex),
      share: Math.round(proportion * 1000) / 10,
    });
  }

  return colors.sort((a, b) => b.share - a.share);
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
