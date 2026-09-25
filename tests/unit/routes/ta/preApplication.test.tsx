import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { msalInstance, resetMsalMock, testAccount } from '../../helpers/mockMsal';
import { renderWithRouter } from '../../helpers/renderWithRouter';

const mocks = vi.hoisted(() => ({
    downloadFileFromUrl: vi.fn(),
}));

vi.mock('@azure/msal-react', async () => {
    const { msalReactModuleMock } = await import('../../helpers/mockMsal');

    return msalReactModuleMock();
});

vi.mock('../../../../ClientApp/src/routes/common/helperFunctions', async (importOriginal) => {
    const original = await importOriginal<Record<string, unknown>>();

    return { ...original, downloadFileFromUrl: mocks.downloadFileFromUrl };
});

const renderPage = async () => {
    const PreApplication = (await import('../../../../ClientApp/src/routes/ta/preApplication')).default;

    return renderWithRouter(<PreApplication />, {
        path: '/ta/pre-application',
        initialPath: '/ta/pre-application',
        extraRoutes: [
            { path: '/dashboard-ta', element: <div data-testid="dashboard-ta" /> },
            { path: '/ta/type-approval-create', element: <div data-testid="create-application" /> },
        ],
    });
};

describe('pattern approval pre-application', () => {
    beforeEach(() => {
        resetMsalMock();
        mocks.downloadFileFromUrl.mockReset();
    });

    it('explains what the applicant needs before starting', async () => {
        await renderPage();

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pattern/type approval');
        expect(screen.getByText('test results, certificates or reports')).toBeInTheDocument();
        expect(screen.getByTestId('info-summary')).toHaveTextContent('New customers');
    });

    it('links out to the certification procedures', async () => {
        await renderPage();

        expect(screen.getByRole('link', { name: /NMI P 106/ }))
            .toHaveAttribute('href', 'https://www.industry.gov.au/sites/default/files/2026-03/nmi-p-106.pdf');
        expect(screen.getByRole('link', { name: /Pattern approval checklist/ }))
            .toHaveAttribute('href', expect.stringContaining('pattern-approval-requirements'));
    });

    it('downloads the credit check form through the authenticated helper', async () => {
        const user = userEvent.setup();
        await renderPage();

        await user.click(screen.getByRole('link', { name: /Download credit check application form/ }));

        // Routed through the helper rather than a plain href: the file sits behind a request that
        // needs the signed-in account, so a bare link would fetch it unauthenticated.
        expect(mocks.downloadFileFromUrl).toHaveBeenCalledWith(
            'https://www.industry.gov.au/sites/default/files/2025-07/NMI-credit-application-form.pdf',
            msalInstance,
            [testAccount],
            'NMI-credit-application-form.pdf',
        );
    });

    it('does not follow the placeholder href when downloading', async () => {
        const user = userEvent.setup();
        const { currentPath } = await renderPage();

        await user.click(screen.getByRole('link', { name: /Download credit check application form/ }));

        // The anchor carries href='#', so without preventDefault the click would navigate.
        expect(currentPath()).toBe('/ta/pre-application');
    });

    it('starts the application', async () => {
        const user = userEvent.setup();
        const { currentPath } = await renderPage();

        await user.click(screen.getByTestId('start-application-button'));

        await waitFor(() => expect(currentPath()).toBe('/ta/type-approval-create'));
    });

    it('offers a way back to the type approval dashboard', async () => {
        const user = userEvent.setup();
        const { currentPath } = await renderPage();

        await user.click(screen.getByTestId('go-to-dashboard-ta'));

        await waitFor(() => expect(currentPath()).toBe('/dashboard-ta'));
    });
});
