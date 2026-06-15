import { clamp, hexToRgb, hslToRgb, mix, rgbToHex, rgbToHsl } from "./convert";
import type { CuratedPalette } from "./interpret";
import type { DesignStrategy } from "./strategy";
import { strategyForMode } from "./strategy";
import { adjustLightness, toUiSafe, transformUi } from "./ui-safe";

export type DesignTokens = {
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  accent: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  focusRing: string;
};

type NeutralSystem = Pick<
  DesignTokens,
  | "background"
  | "surface"
  | "surfaceSecondary"
  | "border"
  | "textPrimary"
  | "textSecondary"
  | "secondary"
  | "secondaryHover"
>;

/** Neutral foundation — inspired by bird hue, never copied from plumage. */
function buildNeutralSystem(
  strategy: DesignStrategy,
  heroNatureHex: string,
): NeutralSystem {
  const { h: heroH } = rgbToHsl(hexToRgb(heroNatureHex));
  const tone = strategy.neutralTone;

  const baseHue =
    tone === "warm" ? 35 : tone === "cool" ? 215 : heroH;
  const sat = tone === "neutral" ? 6 : 10;

  const background = rgbToHex(hslToRgb({ h: baseHue, s: sat * 0.4, l: 98 }));
  const surface = "#FFFFFF";
  const surfaceSecondary = rgbToHex(hslToRgb({ h: baseHue, s: sat, l: 96 }));
  const border = rgbToHex(hslToRgb({ h: baseHue, s: sat * 1.1, l: 89 }));
  const textPrimary = rgbToHex(hslToRgb({ h: baseHue, s: 12, l: 11 }));
  const textSecondary = rgbToHex(hslToRgb({ h: baseHue, s: 8, l: 44 }));

  const secondary = surfaceSecondary;
  const secondaryHover = mix(surfaceSecondary, textPrimary, 0.07);

  return {
    background,
    surface,
    surfaceSecondary,
    border,
    textPrimary,
    textSecondary,
    secondary,
    secondaryHover,
  };
}

function brandPrimary(hex: string, strategy: DesignStrategy): string {
  let ui = toUiSafe(hex, "hero");
  const hsl = rgbToHsl(hexToRgb(ui));

  if (strategy.brandIntensity === "subtle") {
    ui = transformUi(ui, { s: clamp(hsl.s * 0.82, 38, 68), l: clamp(hsl.l + 4, 40, 54) });
  } else if (strategy.brandIntensity === "bold") {
    ui = transformUi(ui, { s: clamp(hsl.s * 1.05, 48, 78), l: clamp(hsl.l, 38, 50) });
  }

  return ui;
}

/** Accent for badges/highlights only — never a second surface color. */
function brandAccent(hex: string, strategy: DesignStrategy): string {
  const ui = toUiSafe(hex, "accent");
  const hsl = rgbToHsl(hexToRgb(ui));

  switch (strategy.accentUsage) {
    case "minimal":
      return transformUi(ui, { s: clamp(hsl.s * 0.55, 28, 50), l: clamp(hsl.l, 44, 52) });
    case "highlights":
      return transformUi(ui, { s: clamp(hsl.s * 0.75, 35, 62), l: clamp(hsl.l, 42, 50) });
    default:
      return transformUi(ui, { s: clamp(hsl.s * 0.9, 40, 70), l: clamp(hsl.l, 40, 52) });
  }
}

/**
 * Stage 2 → Stage 3: translate curated palette into a product design system.
 * Neutrals dominate; bird colors are brand tokens only.
 */
export function buildDesignTokens(
  curated: CuratedPalette,
  strategy: DesignStrategy,
): DesignTokens {
  const neutrals = buildNeutralSystem(strategy, curated.hero.natureHex);

  const primary = brandPrimary(curated.hero.natureHex, strategy);
  const primaryHover = adjustLightness(primary, -6);
  const accent = brandAccent(curated.accent.natureHex, strategy);
  const focusRing = primary;

  return {
    primary,
    primaryHover,
    secondary: neutrals.secondary,
    secondaryHover: neutrals.secondaryHover,
    accent,
    background: neutrals.background,
    surface: neutrals.surface,
    surfaceSecondary: neutrals.surfaceSecondary,
    border: neutrals.border,
    textPrimary: neutrals.textPrimary,
    textSecondary: neutrals.textSecondary,
    focusRing,
  };
}

export const TOKEN_LABELS: { key: keyof DesignTokens; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "primaryHover", label: "Primary hover" },
  { key: "secondary", label: "Secondary" },
  { key: "secondaryHover", label: "Secondary hover" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "surfaceSecondary", label: "Surface secondary" },
  { key: "border", label: "Border" },
  { key: "textPrimary", label: "Text primary" },
  { key: "textSecondary", label: "Text secondary" },
  { key: "focusRing", label: "Focus ring" },
];

/** Always rebuild tokens — stored JSON may use legacy direct color mapping. */
export function hydrateTokens(
  curated: CuratedPalette,
  modeId: string,
): DesignTokens {
  return buildDesignTokens(curated, strategyForMode(modeId));
}
