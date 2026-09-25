import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useLoaderData, useNavigate, useParams } from 'react-router';

import { FALLBACK_TEST_ID, NOT_FOUND_TEST_ID, renderWithRouter } from './renderWithRouter';

const ParamProbe = () => {
    const { id } = useParams();

    return <span data-testid="param-id">{id ?? 'none'}</span>;
};

const LoaderProbe = () => {
    const data = useLoaderData() as { label: string };

    return <span data-testid="loader-label">{data.label}</span>;
};

const NavigateProbe = () => {
    const navigate = useNavigate();

    return (
        <button type="button" onClick={() => navigate('/not-found')}>
            leave
        </button>
    );
};

describe('renderWithRouter harness', () => {
    it('resolves route params, which a bare MemoryRouter does not', async () => {
        renderWithRouter(<ParamProbe />, {
            path: '/type-approval/:id',
            initialPath: '/type-approval/APP-1',
        });

        await waitFor(() => expect(screen.getByTestId('param-id')).toHaveTextContent('APP-1'));
    });

    it('runs a route loader', async () => {
        renderWithRouter(<LoaderProbe />, {
            path: '/type-approval/:id',
            initialPath: '/type-approval/APP-2',
            loader: () => ({ label: 'loaded' }),
        });

        await waitFor(() => expect(screen.getByTestId('loader-label')).toHaveTextContent('loaded'));
    });

    it('exposes the real navigation rather than a mocked navigate', async () => {
        const user = userEvent.setup();
        const { currentPath } = renderWithRouter(<NavigateProbe />, {
            path: '/type-approval/:id',
            initialPath: '/type-approval/APP-3',
        });

        expect(currentPath()).toBe('/type-approval/APP-3');

        await user.click(screen.getByRole('button', { name: 'leave' }));

        await waitFor(() => expect(currentPath()).toBe('/not-found'));
        expect(screen.getByTestId(NOT_FOUND_TEST_ID)).toBeInTheDocument();
    });

    it('distinguishes a redirect to /not-found from matching nothing', async () => {
        const { currentPath } = renderWithRouter(<ParamProbe />, {
            path: '/type-approval/:id',
            initialPath: '/somewhere-else',
        });

        await waitFor(() => expect(screen.getByTestId(FALLBACK_TEST_ID)).toBeInTheDocument());
        expect(screen.queryByTestId(NOT_FOUND_TEST_ID)).not.toBeInTheDocument();
        expect(currentPath()).toBe('/somewhere-else');
    });

    it('mounts extra destination routes so a redirect target is assertable', async () => {
        renderWithRouter(<ParamProbe />, {
            path: '/type-approval/:id',
            initialPath: '/dashboard',
            extraRoutes: [{ path: '/dashboard', element: <span data-testid="dashboard" /> }],
        });

        await waitFor(() => expect(screen.getByTestId('dashboard')).toBeInTheDocument());
    });
});
