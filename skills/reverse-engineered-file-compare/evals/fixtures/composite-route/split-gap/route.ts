export function formatRoute(
  pathname: string,
  search: string,
  _hash: string,
): string {
  return `${pathname}${search}`;
}
