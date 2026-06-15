import { bestTextOn, wcagLevels } from "./accessibility";
import type { DesignTokens } from "./tokens";

export type TokenPairing = {
  foreground: string;
  background: string;
  contrastRatio: number;
  levelAA: boolean;
  levelAAA: boolean;
  label: string;
  sortOrder: number;
};

/** WCAG pairings for the neutral-first token system. */
export function generateTokenPairings(
  tokens: DesignTokens,
  limit = 5,
): TokenPairing[] {
  const onPrimary = bestTextOn(tokens.primary);

  const pairs: Omit<TokenPairing, "sortOrder">[] = [
    pair("Body text on background", tokens.textPrimary, tokens.background),
    pair("Secondary text on background", tokens.textSecondary, tokens.background),
    pair("Body text on surface", tokens.textPrimary, tokens.surface),
    pair("Label on primary button", onPrimary, tokens.primary),
    pair("Border on surface", tokens.border, tokens.surface),
    pair("Primary on background", tokens.primary, tokens.background),
  ].filter((p): p is Omit<TokenPairing, "sortOrder"> => p !== null);

  return pairs
    .sort(
      (a, b) =>
        Number(b.levelAAA) - Number(a.levelAAA) ||
        b.contrastRatio - a.contrastRatio,
    )
    .slice(0, limit)
    .map((p, i) => ({ ...p, sortOrder: i }));
}

function pair(
  label: string,
  foreground: string,
  background: string,
): Omit<TokenPairing, "sortOrder"> | null {
  const { contrastRatio, levelAA, levelAAA } = wcagLevels(foreground, background);
  if (!levelAA) return null;
  return { label, foreground, background, contrastRatio, levelAA, levelAAA };
}
