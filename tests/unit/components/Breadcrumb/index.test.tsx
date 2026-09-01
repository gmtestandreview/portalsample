import { render, screen } from '@testing-library/react';
import type React from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CustomBreadcrumb from '@/components/Breadcrumb';

const ariaLinkMockState = vi.hoisted(() => ({
    includeHref: false,
}));

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
        href,
        render: renderLink,
    }: {
        children: React.ReactNode;
        href?: string;
        render?: (props: { children: React.ReactNode; href?: string }) => React.ReactNode;
    }) => (
        renderLink
            ? renderLink(ariaLinkMockState.includeHref ? { children, href } : { children })
            : <a>{children}</a>
    ),
}));

describe('CustomBreadcrumb React Aria render fallback', () => {
    afterEach(() => {
        ariaLinkMockState.includeHref = false;
    });

    it('renders nothing when no breadcrumbs are provided', () => {
        const { container } = render(<CustomBreadcrumb breadcrumbs={[]} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('throws when a non-current breadcrumb has no destination', () => {
        expect(() => CustomBreadcrumb({
            breadcrumbs: [
                    { text: 'Missing link' },
                    { text: 'Current page' },
            ],
        })).toThrow('Breadcrumb item "Missing link" must include "to" because it is not the current page.');
    });

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

    it('renders previous breadcrumb content as a router link when React Aria props include an href', () => {
        ariaLinkMockState.includeHref = true;

        render(
            <MemoryRouter>
                <CustomBreadcrumb
                    ariaLabel='Request breadcrumbs'
                    containerClassName='request-breadcrumbs'
                    breadcrumbs={[
                        { to: '/dashboard', text: 'Dashboard' },
                        { text: 'Request details' },
                    ]}
                />
            </MemoryRouter>,
        );

        expect(screen.getByRole('navigation', { name: 'Request breadcrumbs' })).toHaveClass('request-breadcrumbs');
        expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    });
});
