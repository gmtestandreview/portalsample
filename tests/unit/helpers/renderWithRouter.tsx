import { render } from '@testing-library/react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import type { RouteObject } from 'react-router';

/**
 * Render a route component the way the application actually mounts it.
 *
 * `renderWithProviders` wraps children in a bare `MemoryRouter`, which is enough for a component
 * that only needs `<Link>` to resolve. It is not enough for the route modules under
 * `routes/ta/**`: those read `useParams()` for an application id and redirect to `/not-found` when
 * it is missing, so under a bare router they take the redirect branch and every assertion after it
 * is measuring the error path.
 *
 * This builds a real `createMemoryRouter` with the route pattern, so params resolve and loaders run.
 *
 * On asserting navigation: the plan called for a `useNavigate` spy, which needs `react-router`
 * itself to be mocked - and mocking the router out of a router test removes the thing under test.
 * `createMemoryRouter` hands back the router object instead, so navigation is readable directly from
 * `router.state.location`. That observes the real navigation rather than the fact that a mocked
 * function was called.
 */

export interface RenderWithRouterOptions extends Omit<RenderOptions, 'wrapper'> {
    /** Route pattern the element is mounted at, e.g. `/type-approval/:id`. Defaults to `initialPath`. */
    readonly path?: string;
    /** URL to start at, e.g. `/type-approval/APP-1`. */
    readonly initialPath?: string;
    /** Loader for the route under test. */
    readonly loader?: RouteObject['loader'];
    /** Extra destination routes, so a redirect lands somewhere assertable. */
    readonly extraRoutes?: readonly RouteObject[];
}

export interface RenderWithRouterResult extends RenderResult {
    readonly router: ReturnType<typeof createMemoryRouter>;
    /** Current pathname. Use instead of a navigate spy. */
    readonly currentPath: () => string;
}

export const NOT_FOUND_TEST_ID = 'router-not-found';
export const FALLBACK_TEST_ID = 'router-fallback';
export const HYDRATING_TEST_ID = 'router-hydrating';

/**
 * React Router warns on stderr when a route carries a loader but no `HydrateFallback`, because it
 * has nothing to render for the frame before the loader settles. Supplying one keeps the harness
 * from emitting a warning into every test that uses a loader.
 */
const HydrateFallback = () => <div data-testid={HYDRATING_TEST_ID} />;

export const renderWithRouter = (
    element: ReactElement,
    {
        path,
        initialPath = '/',
        loader,
        extraRoutes = [],
        ...options
    }: RenderWithRouterOptions = {},
): RenderWithRouterResult => {
    const routes: RouteObject[] = [
        { path: path ?? initialPath, element, loader, HydrateFallback },
        ...extraRoutes,
        // Redirect sinks. Without these a redirect falls through to the splat route and the test
        // cannot tell "navigated to /not-found" from "matched nothing".
        { path: '/not-found', element: <div data-testid={NOT_FOUND_TEST_ID} /> },
        { path: '*', element: <div data-testid={FALLBACK_TEST_ID} /> },
    ];

    const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
    const result = render(<RouterProvider router={router} />, options);

    return {
        ...result,
        router,
        currentPath: () => router.state.location.pathname,
    };
};
