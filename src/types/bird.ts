export type BirdSummary = {
  id: string;
  slug: string;
  name: string;
  scientificName: string;
  thumbUrl: string | null;
  imageUrl: string;
  colorTags: string[];
  characterTags: string[];
  /** Curated UI colors for the grid swatch row. */
  palettePreview: string[];
};

export type PaletteColorData = {
  hex: string;
  rgb: string;
  dominancePct: number;
  colorName: string;
  sortOrder: number;
};

export type CuratedColorData = {
  role: "hero" | "support" | "accent" | "neutral";
  label: string;
  natureHex: string;
  uiHex: string;
};

export type CuratedPaletteData = {
  hero: CuratedColorData;
  support: CuratedColorData;
  accent: CuratedColorData;
  neutral: CuratedColorData;
};

export type DesignTokensData = {
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

export type DesignStrategyData = {
  id: string;
  name: string;
  description: string;
  personality: string[];
};

export type DesignerModeData = {
  id: string;
  name: string;
  description: string;
  rank: number;
  strategy?: DesignStrategyData;
  curated: CuratedPaletteData;
  tokens: DesignTokensData;
  insight: string;
};

/** @deprecated Legacy 60/30/10 variation — use designerModes instead. */
export type PaletteVariationData = {
  id: string;
  name: string;
  rank: number;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  backgroundHex: string;
  foregroundHex: string;
};

export type AccessibilityResultData = {
  foreground: string;
  background: string;
  contrastRatio: number;
  levelAA: boolean;
  levelAAA: boolean;
  sortOrder: number;
  label?: string;
};

export type SimilarBirdData = {
  slug: string;
  name: string;
  thumbUrl: string | null;
  imageUrl: string;
};

export type BirdDetail = {
  id: string;
  slug: string;
  name: string;
  scientificName: string;
  description: string;
  habitat: string | null;
  region: string;
  imageUrl: string;
  /** Segmented cutout — ingest only, never shown in UI. */
  thumbUrl: string | null;
  imageCredit: string | null;
  imageLicense: string | null;
  sourceUrl: string | null;
  colorTags: string[];
  characterTags: string[];
  /** Raw nature extraction — full feather-level data (20–24 colors). */
  paletteColors: PaletteColorData[];
  /** Designer-curated modes with tokens (Authentic, SaaS, Luxury, Minimal). */
  designerModes: DesignerModeData[];
  accessibilityResults: AccessibilityResultData[];
  similar: SimilarBirdData[];
};
