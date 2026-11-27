import { describe, expect, it } from 'vitest';

import routeConfig from '../../../ClientApp/src/routes';

interface RouteEntry {
  children?: RouteEntry[];
  file: string;
  index?: boolean;
  path?: string;
}

interface FlattenedRoute {
  file: string;
  path: string;
  parentFiles: string[];
}

const expectedPaths = [
  '/',
  '/dashboard',
  '/dashboard-ta',
  '/create-account/*',
  '/update-organisation/:id/*',
  '/create-contact/*',
  '/update-contact/*',
  '/success-creating-account',
  '/add-branch/*',
  '/request-for-quote-create',
  '/ta/type-approval-create-pre',
  '/ta/:id/*',
  '/ta/type-approval-create',
  '/ta/type-approval-success/:id/*',
  '/ta/:id/manage',
  '/request-for-quote-copy/:id/*',
  '/request-for-quote/:id/view-summary/*',
  '/request-for-quote/:id/*',
  '/request-for-quote-success/:id/*',
  '/submitted-success/:id/*',
  '/accept-quote-create/:id/*',
  '/accept-quote/:id/*',
  '/quotation/:id/*',
  '/instrument-reports/:id/*',
  '/report/:id/*',
  '/services-we-offer',
  '/sign-in',
  '/sign-out',
  '/sign-out-helper',
  '/help-guide',
  '/help-guide/how-to-setup-access',
  '/help-guide/faqs',
  '/server-error',
  '/conflict',
  '/forbidden',
  '/no-longer-available',
  '/unprocessable',
  '/precondition-failed',
  '/service-unavailable',
  '/not-found',
  '*',
] as const;

const flattenRoutes = (
  entries: RouteEntry[],
  parentFiles: string[] = [],
): FlattenedRoute[] =>
  entries.flatMap((entry) => {
    const nextParentFiles = [...parentFiles, entry.file];
    const currentRoute = entry.index
      ? [{ path: '/', file: entry.file, parentFiles }]
      : entry.path
        ? [
            {
              path: entry.path === '*' ? '*' : `/${entry.path}`,
              file: entry.file,
              parentFiles,
            },
          ]
        : [];

    return [
      ...currentRoute,
      ...(entry.children ? flattenRoutes(entry.children, nextParentFiles) : []),
    ];
  });

const routes = flattenRoutes(routeConfig as unknown as RouteEntry[]);
const routeForPath = (path: string) =>
  routes.find((candidate) => candidate.path === path);

describe('framework route configuration', () => {
  it('preserves the complete route path contract', () => {
    expect(routes.map((route) => route.path).sort()).toStrictEqual(
      [...expectedPaths].sort(),
    );
  });

  it('preserves authentication and layout boundaries', () => {
    expect(routeForPath('/dashboard')?.parentFiles).toContain(
      './frameworkRoutes/authenticatedLayout.tsx',
    );
    expect(routeForPath('/create-contact/*')?.parentFiles).toContain(
      './frameworkRoutes/authenticatedHeaderlessLayout.tsx',
    );
    expect(routeForPath('/help-guide')?.parentFiles).toContain(
      './frameworkRoutes/publicLayout.tsx',
    );
    expect(routeForPath('/sign-out')?.parentFiles).toStrictEqual([]);
  });

  it('uses framework route modules for page components', () => {
    expect(routeForPath('/dashboard')?.file).toBe(
      './routes/dashboard/index.tsx',
    );
    expect(routeForPath('/request-for-quote/:id/view-summary/*')?.file).toBe(
      './routes/requestForQuote/viewRequestForQuoteSummary.tsx',
    );
    expect(routeForPath('/sign-out')?.file).toBe('./routes/sign-out/index.tsx');
  });
});
