import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CustomBreadcrumb from '../../../ClientApp/src/components/Breadcrumb';
import { renderWithProviders } from '../helpers/renderWithProviders';

describe('CustomBreadcrumb', () => {
    it('marks the final breadcrumb item as the current page', () => {
        renderWithProviders(
            <CustomBreadcrumb
                breadcrumbs={[
                    { to: '/', text: 'Home' },
                    { to: '/dashboard', text: 'Dashboard' },
                    { text: 'Request for quote' },
                ]}
            />,
        );

        expect(
            screen.getByRole('navigation', { name: /breadcrumb/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/request for quote/i)).toHaveAttribute('aria-current', 'page');
    });

    it('renders previous breadcrumb items as links', () => {
        renderWithProviders(
            <CustomBreadcrumb
                breadcrumbs={[
                    { to: '/', text: 'Home' },
                    { text: 'Request for quote' },
                ]}
            />,
        );

        expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    });
});
