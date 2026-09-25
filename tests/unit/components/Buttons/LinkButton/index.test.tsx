import { render, screen } from '@testing-library/react';
import type React from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LinkButton from '@/components/Buttons/LinkButton';

const ariaLinkMockState = vi.hoisted(() => ({
    includeHref: false,
}));

vi.mock('react-aria-components/Link', () => ({
    Link: ({
        children,
        className,
        href,
        render: renderLink,
    }: {
        children: React.ReactNode;
        className?: string;
        href?: string;
        render?: (props: { children: React.ReactNode; className?: string; href?: string }) => React.ReactNode;
    }) => (
        renderLink
            ? renderLink(ariaLinkMockState.includeHref ? { children, className, href } : { children, className })
            : <a className={className} href={href}>{children}</a>
    ),
}));

describe('LinkButton React Aria render fallback', () => {
    afterEach(() => {
        ariaLinkMockState.includeHref = false;
    });

    it('renders a span when React Aria render props do not include an href', () => {
        render(
            <LinkButton as='Link' to='/dashboard' variant='btn btn-outline-primary'>
                Dashboard
            </LinkButton>,
        );

        const fallback = screen.getByText('Dashboard');

        expect(fallback.tagName).toBe('SPAN');
        expect(fallback).toHaveClass('btn', 'btn-outline-primary');
        expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    });

    it('renders a router link when React Aria render props include an href', () => {
        ariaLinkMockState.includeHref = true;

        render(
            <MemoryRouter>
                <LinkButton as='Link' to='/dashboard' variant='secondary'>
                    Dashboard
                </LinkButton>
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
        expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveClass('btn', 'btn-secondary');
    });

    it('renders an anchor link when configured as an anchor', () => {
        render(
            <LinkButton as='a' href='https://measurement.gov.au' variant='nmi-primary'>
                NMI
            </LinkButton>,
        );

        expect(screen.getByRole('link', { name: 'NMI' })).toHaveAttribute('href', 'https://measurement.gov.au');
        expect(screen.getByRole('link', { name: 'NMI' })).toHaveClass('btn', 'btn-nmi-primary');
    });

    it('uses the NMI primary variant by default', () => {
        render(
            <LinkButton as='a' href='/requests'>
                Requests
            </LinkButton>,
        );

        expect(screen.getByRole('link', { name: 'Requests' })).toHaveClass('btn', 'btn-nmi-primary');
    });
});
