import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Layout from '@/components/Layout';

vi.mock('@/components/Header', () => ({
    default: () => <header>Mock header</header>,
}));

vi.mock('@/components/Footer', () => ({
    default: () => <footer>Mock footer</footer>,
}));

vi.mock('@/components/Utilities/skipLinks', () => ({
    default: () => <a href='#main'>Skip to main content</a>,
}));

vi.mock('@/components/Utilities/backToTopButton', () => ({
    default: () => <nav aria-label='Back to top'>Back to top</nav>,
}));

vi.mock('@/components/Utilities/routeChangeScrollTop', () => ({
    default: () => null,
}));

vi.mock('@/analytics/GoogleAnalytics', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useRouteAccessibility', () => ({
    useRouteAccessibility: () => ({ announcement: 'Navigated to Dashboard page.' }),
}));

describe('Layout', () => {
    it('renders page chrome, main content, and the route announcement region', () => {
        render(
            <MemoryRouter>
                <Layout>
                    <h1>Dashboard</h1>
                </Layout>
            </MemoryRouter>,
        );

        expect(screen.getByRole('banner')).toHaveTextContent('Mock header');
        expect(screen.getByRole('contentinfo')).toHaveTextContent('Mock footer');
        expect(screen.getByRole('main')).toHaveTextContent('Dashboard');
        expect(screen.getByRole('status')).toHaveTextContent('Navigated to Dashboard page.');
        expect(screen.getByRole('status')).toHaveClass('visually-hidden');
        expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main');
        expect(screen.getByRole('navigation', { name: 'Back to top' })).toBeInTheDocument();
    });
});
