import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { Link, useLocation } from 'react-router';
import { renderWithProviders } from './renderWithProviders';

const LocationProbe = () => {
  const location = useLocation();

  return (
    <>
      <span data-testid='pathname'>{location.pathname}</span>
      <Link to='/next'>Next</Link>
    </>
  );
};

// function suite titles are required by vitest/prefer-describe-function-title.
describe(renderWithProviders, () => {
  const renderWithRoute = renderWithProviders as unknown as (
    ui: ReactNode,
    options: {
      route: string;
      wrapper?: (props: { children: ReactNode }) => ReactNode;
    },
  ) => void;

  it('renders components inside a memory router', () => {
    expect.hasAssertions();

    renderWithRoute(<LocationProbe />, { route: '/start' });

    expect(screen.getByTestId('pathname')).toHaveTextContent('/start');
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/next',
    );
  });

  it('keeps the memory router wrapper when render options include a wrapper', () => {
    expect.hasAssertions();

    const NoRouterWrapper = ({ children }: { children: ReactNode }) => (
      <>{children}</>
    );

    renderWithRoute(<LocationProbe />, {
      route: '/protected',
      wrapper: NoRouterWrapper,
    });

    expect(screen.getByTestId('pathname')).toHaveTextContent('/protected');
  });
});
