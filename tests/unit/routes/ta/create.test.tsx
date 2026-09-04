import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import type { ReactNode } from 'react';

import CreateRequestForTypeApproval from '../../../../ClientApp/src/routes/ta/create';

const mocks = vi.hoisted(() => ({
    accounts: [{ homeAccountId: 'account-1' }] as AccountInfo[],
    acquireTokenSilent: vi.fn(),
    setAuthToken: vi.fn(),
    createApplication: vi.fn(),
    appLoggerError: vi.fn(),
}));

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: mocks.accounts,
        instance: {
            acquireTokenSilent: mocks.acquireTokenSilent,
        } as unknown as IPublicClientApplication,
    }),
}));

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['type-approval.scope'] },
}));

vi.mock('../../../../ClientApp/src/api/web-api-client', () => ({
    ApplicationType: {
        PatternApproval: 'PatternApproval',
    },
    ApplicationClient: vi.fn(function ApplicationClientMock() {
        return {
            setAuthToken: mocks.setAuthToken,
            createApplication: mocks.createApplication,
        };
    }),
}));

vi.mock('../../../../ClientApp/src/components/BlockUISpinner', () => ({
    default: ({ children }: { children: ReactNode }) => (
        <div data-testid='block-ui-spinner'>{children}</div>
    ),
}));

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        error: mocks.appLoggerError,
    },
}));

const renderCreateRoute = () => render(
    <MemoryRouter initialEntries={['/ta/create']}>
        <Routes>
            <Route path='/ta/create' element={<CreateRequestForTypeApproval />} />
            <Route path='/ta/:id/organisation-details' element={<div>Organisation details destination</div>} />
        </Routes>
    </MemoryRouter>,
);

describe('CreateRequestForTypeApproval', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.accounts = [{ homeAccountId: 'account-1' }] as AccountInfo[];
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'token-1' });
        mocks.createApplication.mockResolvedValue({ referenceId: 'PA-100' });
    });

    it('creates a pattern approval application and redirects to organisation details', async () => {
        renderCreateRoute();

        expect(screen.getByTestId('block-ui-spinner')).toHaveTextContent('Loading...');

        await waitFor(() => {
            expect(screen.getByText('Organisation details destination')).toBeInTheDocument();
        });
        expect(mocks.acquireTokenSilent).toHaveBeenCalledWith({
            scopes: ['type-approval.scope'],
            account: mocks.accounts[0],
        });
        expect(mocks.setAuthToken).toHaveBeenCalledWith('token-1');
        expect(mocks.createApplication).toHaveBeenCalledWith({
            applicationType: 'PatternApproval',
        });
    });

    it('logs a client failure and leaves the user on the loading state', async () => {
        const error = new Error('create failed');
        mocks.createApplication.mockRejectedValue(error);

        renderCreateRoute();

        await waitFor(() => {
            expect(mocks.appLoggerError).toHaveBeenCalledWith(
                'Failed to create application',
                error,
            );
        });
        expect(screen.getByTestId('block-ui-spinner')).toHaveTextContent('Loading...');
        expect(screen.queryByText('Organisation details destination')).not.toBeInTheDocument();
    });
});
