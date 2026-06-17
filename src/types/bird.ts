export type PlumageColorData = {
  hex: string;
  family: string;
  share: number;
};

export type ThemeTokensData = {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
};

export type BirdSummary = {
  id: string;
  slug: string;
  name: string;
  scientificName: string;
  region: string;
  imageUrl: string;
  colorFamilies: string[];
  /** Up to 4 hex swatches for grid cards. */
  preview: string[];
};

export type SimilarBirdData = {
  slug: string;
  name: string;
  imageUrl: string;
  preview: string[];
};

export type BirdDetail = BirdSummary & {
  colors: PlumageColorData[];
  theme: ThemeTokensData;
  wcagAA: boolean;
  similar: SimilarBirdData[];
};

/** Slim index entry for client-side search (public/data/index.json). */
export type BirdIndexEntry = {
  slug: string;
  name: string;
  scientificName: string;
  region: string;
  imageUrl: string;
  colorFamilies: string[];
  preview: string[];
};
