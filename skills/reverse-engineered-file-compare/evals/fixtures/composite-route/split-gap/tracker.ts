import { formatRoute } from './route';

export function buildPageView(
  enabled: boolean,
  pathname: string,
  search: string,
  hash: string,
): string | null {
  return enabled ? formatRoute(pathname, search, hash) : null;
}
