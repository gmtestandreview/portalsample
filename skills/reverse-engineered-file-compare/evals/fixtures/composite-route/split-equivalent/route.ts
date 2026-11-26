export function formatRoute(
  pathname: string,
  search: string,
  hash: string,
): string {
  return `${pathname}${search}${hash}`;
}
