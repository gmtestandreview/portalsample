import { render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it } from 'vitest';
import LinkButton from '@/components/Buttons/LinkButton';

vi.mock('react-aria-components/Link', () => ({
    Link: ({
        children,
        className,
        render: renderLink,
    }: {
        children: React.ReactNode;
        className?: string;
        render?: (props: { children: React.ReactNode; className?: string }) => React.ReactNode;
    }) => (
        renderLink
            ? renderLink({ children, className })
            : <a className={className}>{children}</a>
    ),
}));

describe('LinkButton React Aria render fallback', () => {
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
});
