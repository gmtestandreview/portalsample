import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import AuthenticatedHeaderlessLayout from '@/frameworkRoutes/authenticatedHeaderlessLayout';
import AuthenticatedLayout from '@/frameworkRoutes/authenticatedLayout';
import PublicLayout from '@/frameworkRoutes/publicLayout';

vi.mock(
  import('@/authentication/AuthenticatedElement'),
  (() =>
    ({
      default: ({
        children,
        displayHeaderAndFooter = true,
      }: {
        children?: ReactNode;
        displayHeaderAndFooter?: boolean | undefined;
      }) => (
        <div
          data-testid='authenticated-element'
          data-header-and-footer={String(displayHeaderAndFooter)}
        >
          {children}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule176>) as unknown as __DynamicPartialMockFactory<__TestMockModule176>,
);

vi.mock(
  import('@/components/Layout'),
  () =>
    ({
      default: ({ children }: { children: ReactNode }) => (
        <div data-testid='public-chrome'>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule110>,
);

const renderLayout = (Layout: () => ReactNode) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<p>routed child</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('framework layout routes', () => {
  it('wraps public child routes in the public page chrome', () => {
    expect.hasAssertions();

    renderLayout(PublicLayout);

    expect(screen.getByTestId('public-chrome')).toContainElement(
      screen.getByText('routed child'),
    );
    expect(
      screen.queryByTestId('authenticated-element'),
    ).not.toBeInTheDocument();
  });

  it('wraps authenticated child routes with the header and footer', () => {
    expect.hasAssertions();

    renderLayout(AuthenticatedLayout);

    const guard = screen.getByTestId('authenticated-element');

    expect(guard).toHaveAttribute('data-header-and-footer', 'true');
    expect(guard).toContainElement(screen.getByText('routed child'));
  });

  it('wraps headerless authenticated child routes without the header and footer', () => {
    expect.hasAssertions();

    renderLayout(AuthenticatedHeaderlessLayout);

    const guard = screen.getByTestId('authenticated-element');

    expect(guard).toHaveAttribute('data-header-and-footer', 'false');
    expect(guard).toContainElement(screen.getByText('routed child'));
  });
});
