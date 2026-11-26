export function buildPageView(
  enabled: boolean,
  pathname: string,
  search: string,
  hash: string,
): string | null {
  if (!enabled) return null;
  return `${pathname}${search}${hash}`;
}
