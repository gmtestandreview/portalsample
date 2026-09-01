import { render, screen } from '@testing-library/react';
import type React from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import CustomBreadcrumb from '@/components/Breadcrumb';

vi.mock('react-aria-components/Breadcrumbs', () => ({
    Breadcrumbs: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <ol className={className}>{children}</ol>
    ),
    Breadcrumb: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <li className={className}>{children}</li>
    ),
}));

vi.mock('react-aria-components/Link', () => ({
    Link: ({
        children,
        render: renderLink,
    }: {
        children: React.ReactNode;
        render?: (props: { children: React.ReactNode }) => React.ReactNode;
    }) => (
        renderLink
            ? renderLink({ children })
            : <a>{children}</a>
    ),
}));

describe('CustomBreadcrumb React Aria render fallback', () => {
    it('renders previous breadcrumb content as a span when React Aria props do not include an href', () => {
        render(
            <MemoryRouter>
                <CustomBreadcrumb
                    breadcrumbs={[
                        { to: '/', text: 'Home' },
                        { text: 'Request details' },
                    ]}
                />
            </MemoryRouter>,
        );

        const fallback = screen.getByText('Home');

        expect(fallback.tagName).toBe('SPAN');
        expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument();
        expect(screen.getByText('Request details')).toHaveAttribute('aria-current', 'page');
    });
});
