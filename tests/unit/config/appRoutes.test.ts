import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';

import App from '../../../ClientApp/src/App';
import AuthenticatedElement from '../../../ClientApp/src/authentication/AuthenticatedElement';
import Layout from '../../../ClientApp/src/components/Layout';

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

const firstEagerErrorRoute = expectedPaths.indexOf('/server-error');
const lazyFeaturePaths = expectedPaths.slice(1, firstEagerErrorRoute);
const layoutPaths = new Set([
  '/sign-out-helper',
  '/help-guide',
  '/help-guide/how-to-setup-access',
  '/help-guide/faqs',
]);
const headerlessPaths = new Set([
  '/create-account/*',
  '/update-organisation/:id/*',
  '/create-contact/*',
  '/update-contact/*',
  '/success-creating-account',
  '/add-branch/*',
  '/ta/:id/*',
  '/ta/type-approval-success/:id/*',
  '/request-for-quote/:id/view-summary/*',
  '/request-for-quote/:id/*',
  '/request-for-quote-success/:id/*',
  '/submitted-success/:id/*',
  '/accept-quote/:id/*',
]);

type LazyComponent = () => ReactElement<{
  children?: ReactElement<{ name?: string }>;
  displayHeaderAndFooter?: boolean;
}>;

const loadComponent = async (path: (typeof lazyFeaturePaths)[number]) => {
  const route = App.routes.find((candidate) => candidate.path === path);

  if (route?.lazy === undefined) {
    throw new Error(`Expected ${path} to define a lazy route module`);
  }

  const module = await (
    route.lazy as () => Promise<{ Component: LazyComponent }>
  )();

  return module.Component;
};

const routeWrapperContract = (path: string, element: ReactElement) => {
  if (layoutPaths.has(path)) return { type: element.type };
  if (path === '/sign-out') {
    return {
      authenticated: element.type === AuthenticatedElement,
      layout: element.type === Layout,
    };
  }
  const contract = {
    type: element.type,
    displayHeaderAndFooter: element.props.displayHeaderAndFooter,
  };
  return path === '/request-for-quote/:id/view-summary/*'
    ? { ...contract, childName: element.props.children?.props.name }
    : contract;
};

const expectedRouteWrapperContract = (path: string) => {
  if (layoutPaths.has(path)) return { type: Layout };
  if (path === '/sign-out') return { authenticated: false, layout: false };
  const contract = {
    type: AuthenticatedElement,
    displayHeaderAndFooter: headerlessPaths.has(path) ? false : undefined,
  };
  return path === '/request-for-quote/:id/view-summary/*'
    ? { ...contract, childName: '' }
    : contract;
};

describe('application route loading', () => {
  it('renders the loading fallback for lazy routes', () => {
    expect.hasAssertions();

    const dashboardRoute = App.routes.find(
      (candidate) => candidate.path === '/dashboard',
    );

    const fallback = dashboardRoute?.hydrateFallbackElement as ReactElement;
    const Fallback = fallback.type as () => ReactElement;

    expect(Fallback()).toMatchObject({
      type: expect.anything(),
      props: {
        children: expect.anything(),
      },
    });
  });

  it('preserves the complete route path contract', () => {
    expect.hasAssertions();

    expect(App.routes.map(({ path }) => path)).toStrictEqual(expectedPaths);
  });

  it.each(lazyFeaturePaths)('loads %s through a route module', (path) => {
    expect.hasAssertions();

    const route = App.routes.find((candidate) => candidate.path === path);

    expect(route?.lazy).toStrictEqual(expect.any(Function));
    expect(route?.element).toBeUndefined();
  });

  it.each(lazyFeaturePaths)(
    'resolves %s and preserves its outer route wrapper',
    async (path) => {
      expect.hasAssertions();

      const Component = await loadComponent(path);
      const element = Component();

      expect(routeWrapperContract(path, element)).toStrictEqual(
        expectedRouteWrapperContract(path),
      );
    },
  );
});
