import { hexToRgb, mix, rgbToHsl } from "./convert";
import { bestTextOn } from "./accessibility";
import type { ThemeTokens } from "./plumage";

/** shadcn expects CSS variables as space-separated "H S% L%" triples. */
export function hexToHslString(hex: string): string {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

/** Maps plumage theme tokens onto shadcn/ui CSS variables. */
export function buildThemeVarsFromTokens(
  tokens: ThemeTokens,
): Record<string, string> {
  const onPrimary = bestTextOn(tokens.primary);

  return {
    "--background": hexToHslString(tokens.background),
    "--foreground": hexToHslString(tokens.text),
    "--card": hexToHslString(tokens.surface),
    "--card-foreground": hexToHslString(tokens.text),
    "--primary": hexToHslString(tokens.primary),
    "--primary-foreground": hexToHslString(onPrimary),
    "--secondary": hexToHslString(mix(tokens.background, tokens.text, 0.06)),
    "--secondary-foreground": hexToHslString(tokens.text),
    "--accent": hexToHslString(mix(tokens.surface, tokens.primary, 0.05)),
    "--accent-foreground": hexToHslString(tokens.text),
    "--muted": hexToHslString(mix(tokens.background, tokens.text, 0.04)),
    "--muted-foreground": hexToHslString(tokens.textMuted),
    "--border": hexToHslString(tokens.border),
    "--input": hexToHslString(tokens.border),
    "--ring": hexToHslString(tokens.primary),
    "--destructive": "0 72% 51%",
    "--destructive-foreground": "0 0% 100%",
    "--radius": "0.5rem",
  };
}
