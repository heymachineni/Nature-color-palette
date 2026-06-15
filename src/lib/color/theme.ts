import { hexToRgb, mix, rgbToHsl } from "./convert";
import { bestTextOn } from "./accessibility";
import type { DesignTokens } from "./tokens";

/** shadcn expects CSS variables as space-separated "H S% L%" triples. */
export function hexToHslString(hex: string): string {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

/**
 * Maps product design tokens onto shadcn/ui variables.
 * Surfaces and text stay neutral; brand color appears on primary + focus only.
 */
export function buildThemeVarsFromTokens(
  tokens: DesignTokens,
): Record<string, string> {
  const onPrimary = bestTextOn(tokens.primary);

  return {
    "--background": hexToHslString(tokens.background),
    "--foreground": hexToHslString(tokens.textPrimary),
    "--card": hexToHslString(tokens.surface),
    "--card-foreground": hexToHslString(tokens.textPrimary),
    "--primary": hexToHslString(tokens.primary),
    "--primary-foreground": hexToHslString(onPrimary),
    "--secondary": hexToHslString(tokens.secondary),
    "--secondary-foreground": hexToHslString(tokens.textPrimary),
    "--accent": hexToHslString(mix(tokens.surface, tokens.primary, 0.05)),
    "--accent-foreground": hexToHslString(tokens.textPrimary),
    "--muted": hexToHslString(tokens.surfaceSecondary),
    "--muted-foreground": hexToHslString(tokens.textSecondary),
    "--border": hexToHslString(tokens.border),
    "--input": hexToHslString(tokens.border),
    "--ring": hexToHslString(tokens.focusRing),
    "--destructive": "0 72% 51%",
    "--destructive-foreground": "0 0% 100%",
    "--radius": "0.5rem",
  };
}

/** @deprecated Use buildThemeVarsFromTokens. */
export type ThemeVariation = {
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  backgroundHex: string;
  foregroundHex: string;
};

export function buildThemeVars(v: ThemeVariation): Record<string, string> {
  return buildThemeVarsFromTokens({
    primary: v.primaryHex,
    primaryHover: v.primaryHex,
    secondary: mix(v.backgroundHex, v.foregroundHex, 0.06),
    secondaryHover: mix(v.backgroundHex, v.foregroundHex, 0.1),
    accent: v.accentHex,
    background: v.backgroundHex,
    surface: "#FFFFFF",
    surfaceSecondary: mix(v.backgroundHex, v.foregroundHex, 0.04),
    border: mix(v.backgroundHex, v.foregroundHex, 0.12),
    textPrimary: v.foregroundHex,
    textSecondary: mix(v.foregroundHex, v.backgroundHex, 0.45),
    focusRing: v.primaryHex,
  });
}
