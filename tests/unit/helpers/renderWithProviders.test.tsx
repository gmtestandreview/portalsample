import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { Link, useLocation } from 'react-router';
import { renderWithProviders } from './renderWithProviders';

const LocationProbe = () => {
    const location = useLocation();

    return (
        <>
            <span data-testid="pathname">{location.pathname}</span>
            <Link to="/next">Next</Link>
        </>
    );
};

describe('renderWithProviders', () => {
    it('renders components inside a memory router', () => {
        renderWithProviders(<LocationProbe />, { route: '/start' });

        expect(screen.getByTestId('pathname')).toHaveTextContent('/start');
        expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('href', '/next');
    });

    it('keeps the memory router wrapper when render options include a wrapper', () => {
        const NoRouterWrapper = ({ children }: { children: ReactNode }) => <>{children}</>;

        renderWithProviders(<LocationProbe />, {
            route: '/protected',
            wrapper: NoRouterWrapper,
        } as unknown as Parameters<typeof renderWithProviders>[1]);

        expect(screen.getByTestId('pathname')).toHaveTextContent('/protected');
    });
});
