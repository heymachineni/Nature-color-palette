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

export type PaletteSwatch = {
  hex: string;
  share: number;
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
  /** Every plumage color with its proportion — for the full-width gallery swatch. */
  palette: PaletteSwatch[];
  /** Full named plumage colors — powers the detail modal. */
  colors: PlumageColorData[];
  /** Slugs of similar birds — resolved client-side for related palettes. */
  similar: string[];
};

export type BirdDetail = BirdSummary & {
  theme: ThemeTokensData;
  wcagAA: boolean;
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
  palette: PaletteSwatch[];
  colors: PlumageColorData[];
  similar: string[];
};
