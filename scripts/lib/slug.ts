export function slugFromScientificName(scientificName: string): string {
  return scientificName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
