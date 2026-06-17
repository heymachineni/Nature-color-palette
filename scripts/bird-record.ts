export type BirdRecord = {
  slug: string;
  name: string;
  scientificName: string;
  region: string;
  imageUrl: string;
  colors: { hex: string; family: string; share: number }[];
  colorFamilies: string[];
  theme: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  wcagAA: boolean;
  similar?: { slug: string; rank: number }[];
  updatedAt: string;
};
