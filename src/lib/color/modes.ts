import { hexToRgb, rgbToHsl } from "./convert";
import type { CuratedColor, CuratedPalette } from "./interpret";
import { interpretPalette, paletteInsight } from "./interpret";
import type { ExtractedColor } from "./extract";
import { buildDesignTokens, type DesignTokens } from "./tokens";
import {
  deepFrom,
  offWhiteFrom,
  silverFrom,
  slateFrom,
  toUiSafe,
  transformUi,
} from "./ui-safe";
import {
  type DesignStrategy,
  strategyForMode,
  strategyNote,
} from "./strategy";

export type DesignerMode = {
  id: string;
  name: string;
  description: string;
  rank: number;
  strategy: DesignStrategy;
  curated: CuratedPalette;
  tokens: DesignTokens;
  insight: string;
};

function remap(
  base: CuratedPalette,
  patch: Partial<Record<keyof CuratedPalette, Partial<CuratedColor>>>,
): CuratedPalette {
  const roles = ["hero", "support", "accent", "neutral"] as const;
  const out = { ...base };
  for (const role of roles) {
    if (patch[role]) {
      out[role] = { ...base[role], ...patch[role]! };
    }
  }
  return out;
}

function mode(
  id: string,
  name: string,
  description: string,
  rank: number,
  curated: CuratedPalette,
  raw: ExtractedColor[],
): DesignerMode {
  const strategy = strategyForMode(id);
  return {
    id,
    name,
    description,
    rank,
    strategy,
    curated,
    tokens: buildDesignTokens(curated, strategy),
    insight: paletteInsight(curated, raw),
  };
}

/**
 * One bird → multiple designer intentions.
 * Curated palette = nature interpretation. Tokens = neutral product system.
 */
export function buildDesignerModes(
  raw: ExtractedColor[],
): DesignerMode[] {
  const authentic = interpretPalette(raw);
  const { h } = rgbToHsl(hexToRgb(authentic.hero.natureHex));

  const saas = remap(authentic, {
    hero: {
      uiHex: toUiSafe(authentic.hero.natureHex, "hero"),
    },
    support: {
      label: "Support",
      uiHex: slateFrom(h),
      natureHex: slateFrom(h),
    },
    neutral: {
      uiHex: "#F8FAFC",
      natureHex: "#F8FAFC",
    },
  });

  const luxury = remap(authentic, {
    hero: {
      uiHex: deepFrom(authentic.hero.natureHex),
      natureHex: deepFrom(authentic.hero.natureHex),
      label: "Hero",
    },
    support: {
      uiHex: silverFrom(authentic.support.natureHex),
      natureHex: silverFrom(authentic.support.natureHex),
    },
    neutral: {
      uiHex: offWhiteFrom(authentic.neutral.natureHex),
      natureHex: offWhiteFrom(authentic.neutral.natureHex),
    },
  });

  const minimal = remap(authentic, {
    support: {
      uiHex: offWhiteFrom(authentic.support.natureHex),
      natureHex: offWhiteFrom(authentic.support.natureHex),
    },
    accent: {
      uiHex: transformUi(authentic.hero.natureHex, {
        s: Math.min(rgbToHsl(hexToRgb(authentic.hero.natureHex)).s * 0.4, 25),
        l: 88,
      }),
    },
    neutral: {
      uiHex: "#FAFAF9",
      natureHex: "#FAFAF9",
    },
  });

  const modes = [
    mode(
      "authentic",
      "Authentic Nature",
      strategyNote(strategyForMode("authentic"), authentic),
      0,
      authentic,
      raw,
    ),
    mode(
      "saas",
      "Modern SaaS",
      strategyNote(strategyForMode("saas"), saas),
      1,
      saas,
      raw,
    ),
    mode(
      "luxury",
      "Luxury",
      strategyNote(strategyForMode("luxury"), luxury),
      2,
      luxury,
      raw,
    ),
    mode(
      "minimal",
      "Minimal",
      strategyNote(strategyForMode("minimal"), minimal),
      3,
      minimal,
      raw,
    ),
  ];

  return modes;
}

export { strategyNote };
