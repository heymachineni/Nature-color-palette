import type { CuratedPalette } from "./interpret";

export type StrategyId =
  | "editorial"
  | "minimal"
  | "premium"
  | "playful"
  | "modern-saas";

export type BrandIntensity = "subtle" | "balanced" | "bold";
export type NeutralTone = "warm" | "cool" | "neutral";
export type AccentUsage = "minimal" | "highlights" | "moderate";

export type DesignStrategy = {
  id: StrategyId;
  name: string;
  description: string;
  personality: string[];
  brandIntensity: BrandIntensity;
  neutralTone: NeutralTone;
  accentUsage: AccentUsage;
};

export const STRATEGIES: Record<StrategyId, DesignStrategy> = {
  editorial: {
    id: "editorial",
    name: "Editorial",
    description:
      "Neutral canvas with the bird's hue reserved for emphasis and navigation.",
    personality: ["Refined", "Readable", "Restrained"],
    brandIntensity: "balanced",
    neutralTone: "warm",
    accentUsage: "highlights",
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description:
      "Almost invisible chrome — one brand color, everything else gray.",
    personality: ["Calm", "Focused", "Quiet"],
    brandIntensity: "subtle",
    neutralTone: "neutral",
    accentUsage: "minimal",
  },
  premium: {
    id: "premium",
    name: "Premium",
    description:
      "Cool neutrals with deep brand accents — luxury through restraint.",
    personality: ["Confident", "Elevated", "Precise"],
    brandIntensity: "balanced",
    neutralTone: "cool",
    accentUsage: "highlights",
  },
  playful: {
    id: "playful",
    name: "Playful",
    description:
      "Friendly product tone — brand color on actions, neutrals everywhere else.",
    personality: ["Energetic", "Approachable", "Bright"],
    brandIntensity: "bold",
    neutralTone: "warm",
    accentUsage: "moderate",
  },
  "modern-saas": {
    id: "modern-saas",
    name: "Modern SaaS",
    description:
      "Default product system — white surfaces, gray text, brand on primary actions.",
    personality: ["Professional", "Clear", "Trustworthy"],
    brandIntensity: "balanced",
    neutralTone: "cool",
    accentUsage: "highlights",
  },
};

/** Maps designer mode tabs to a product design strategy. */
export function strategyForMode(modeId: string): DesignStrategy {
  switch (modeId) {
    case "authentic":
      return STRATEGIES.editorial;
    case "saas":
      return STRATEGIES["modern-saas"];
    case "luxury":
      return STRATEGIES.premium;
    case "minimal":
      return STRATEGIES.minimal;
    default:
      return STRATEGIES["modern-saas"];
  }
}

/** One-line strategy note for the UI — how brand color is applied. */
export function strategyNote(
  strategy: DesignStrategy,
  curated: CuratedPalette,
): string {
  const brand = curated.hero.label.toLowerCase();
  switch (strategy.id) {
    case "minimal":
      return `${brand} appears only on primary actions — surfaces stay neutral.`;
    case "premium":
      return `Cool gray system with ${brand} reserved for key interactions.`;
    case "playful":
      return `Neutral base with ${brand} on CTAs and selected states.`;
    case "editorial":
      return `Paper-white surfaces; ${brand} carries emphasis, not decoration.`;
    default:
      return `SaaS-standard neutrals with ${brand} on buttons, focus, and active nav.`;
  }
}
