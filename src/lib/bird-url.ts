/** Parse `/birds/{slug}` from a pathname. */
export function birdSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/birds\/([^/]+)\/?$/);
  return match?.[1] ?? null;
}
