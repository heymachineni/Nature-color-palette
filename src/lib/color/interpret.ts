import { nameColor } from "./naming";
import { colorDistance, type ExtractedColor } from "./extract";
import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from "./convert";
import { toUiSafe, type UiRole } from "./ui-safe";

export type CuratedRole = "hero" | "support" | "accent" | "neutral";

export type CuratedColor = {
  role: CuratedRole;
  label: string;
  natureHex: string;
  uiHex: string;
};

export type CuratedPalette = {
  hero: CuratedColor;
  support: CuratedColor;
  accent: CuratedColor;
  neutral: CuratedColor;
};

function saturation(hex: string): number {
  return rgbToHsl(hexToRgb(hex)).s;
}

function lightness(hex: string): number {
  return rgbToHsl(hexToRgb(hex)).l;
}

/** Hero score: memorability × saturation — not pixel count. */
function heroScore(c: ExtractedColor, pool: ExtractedColor[]): number {
  const sat = saturation(c.hex);
  const l = lightness(c.hex);
  if (l < 14 || l > 92) return -1;
  if (sat < 28) return -1;
  // Pale beak/bone tones should not beat vivid casque or crown colors.
  if (l > 76 && sat < 52) return -1;

  const avgDist =
    pool.reduce((sum, o) => sum + colorDistance(c.hex, o.hex), 0) / pool.length;
  const visibility =
    Math.sqrt(c.dominancePct + 0.5) * 9 * (0.35 + (sat / 100) * 0.65);
  const memorability = sat * (0.65 + Math.min(avgDist / 35, 1) * 0.35);
  const vividMidtone =
    sat > 48 && l >= 28 && l <= 68 ? sat * 0.35 : 0;

  return memorability * 0.58 + visibility * 0.12 + sat * 0.25 + vividMidtone;
}

function asCurated(
  role: CuratedRole,
  label: string,
  source: ExtractedColor | { hex: string },
): CuratedColor {
  return {
    role,
    label,
    natureHex: source.hex,
    // Body shows the true plumage mass color; other roles stay UI-safe.
    uiHex:
      role === "support" ? source.hex : toUiSafe(source.hex, role),
  };
}

function pickHero(pool: ExtractedColor[]): ExtractedColor {
  const scored = pool
    .map((c) => ({ c, score: heroScore(c, pool) }))
    .filter((x) => x.score >= 0);
  if (!scored.length) return pool[0];

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0].score;
  const tier = scored.filter((x) => x.score >= top * 0.9);
  tier.sort(
    (a, b) =>
      saturation(b.c.hex) - saturation(a.c.hex) ||
      b.c.dominancePct - a.c.dominancePct,
  );
  return tier[0].c;
}

function pickBody(hero: ExtractedColor, pool: ExtractedColor[]): ExtractedColor {
  const ranked = [...pool].sort((a, b) => b.dominancePct - a.dominancePct);
  return (
    ranked.find(
      (c) => c.hex !== hero.hex && colorDistance(c.hex, hero.hex) > 6,
    ) ??
    ranked[1] ??
    ranked[0]
  );
}

function pickAccent(
  hero: ExtractedColor,
  body: ExtractedColor,
  pool: ExtractedColor[],
): ExtractedColor {
  const used = new Set([hero.hex, body.hex]);
  const candidates = pool.filter(
    (c) => !used.has(c.hex) && colorDistance(c.hex, hero.hex) > 10,
  );

  const vivid = [...candidates].sort(
    (a, b) =>
      saturation(b.hex) - saturation(a.hex) ||
      b.dominancePct - a.dominancePct,
  );
  let pick = vivid[0];

  if (!pick) {
    pick =
      candidates.sort((a, b) => b.dominancePct - a.dominancePct)[0] ?? body;
  }

  if (pick.hex === body.hex || colorDistance(pick.hex, body.hex) < 5) {
    const alt = candidates.find((c) => colorDistance(c.hex, body.hex) >= 5);
    if (alt) pick = alt;
  }

  return pick;
}

function pickNeutral(pool: ExtractedColor[]): { hex: string } {
  const muted = pool
    .filter((c) => saturation(c.hex) < 22 || (lightness(c.hex) > 78 && saturation(c.hex) < 30))
    .sort((a, b) => lightness(b.hex) - lightness(a.hex));
  if (muted.length) return muted[0];

  const hero = pickHero(pool);
  const { h } = rgbToHsl(hexToRgb(hero.hex));
  return { hex: rgbToHex(hslToRgb({ h, s: 10, l: 97 })) };
}

/**
 * Designer interpretation: Signature / Body / Accent / Neutral.
 * Body = highest pixel share (plumage mass). Hero = signature vivid hue.
 */
export function interpretPalette(raw: ExtractedColor[]): CuratedPalette {
  if (raw.length === 0) {
    const fallback = { hex: "#64748B" };
    return {
      hero: asCurated("hero", "Signature", fallback),
      support: asCurated("support", "Body", fallback),
      accent: asCurated("accent", "Accent", fallback),
      neutral: asCurated("neutral", "Neutral", { hex: "#F8F7F5" }),
    };
  }

  const hero = pickHero(raw);
  const body = pickBody(hero, raw);
  const accent = pickAccent(hero, body, raw);
  const neutral = pickNeutral(raw);

  return {
    hero: asCurated("hero", "Signature", hero),
    support: asCurated("support", "Body", body),
    accent: asCurated("accent", "Accent", accent),
    neutral: asCurated("neutral", "Neutral", neutral),
  };
}

/** Short designer-facing insight about the palette's character. */
export function paletteInsight(
  curated: CuratedPalette,
  raw: ExtractedColor[],
): string {
  const bodyPct =
    raw.find((c) => c.hex === curated.support.natureHex)?.dominancePct ?? 0;
  if (bodyPct >= 18 && colorDistance(curated.hero.natureHex, curated.support.natureHex) > 20) {
    return `Led by ${nameColor(curated.support.natureHex)} plumage (${Math.round(bodyPct)}% of the bird) with ${nameColor(curated.hero.natureHex)} as the signature accent.`;
  }
  return `Led by ${nameColor(curated.hero.natureHex)} — the bird's signature hue, tuned for product use.`;
}

/** The 4–5 designer-facing colors shown by default (not the full raw set). */
export function curatedDisplayList(curated: CuratedPalette): CuratedColor[] {
  return [curated.hero, curated.support, curated.accent, curated.neutral];
}
