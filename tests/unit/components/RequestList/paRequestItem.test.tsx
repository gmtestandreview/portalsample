import type React from 'react';
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import type * as NotificationModule from '@/storage/notification';
import type * as WebApiClientModule from '@/api/web-api-client';
import {
    ApplicationType,
    type PatternApprovalDashboardDetailsDto,
} from '@/api/web-api-client';
import PaRequestItem from '@/components/RequestList/paRequestItem';
import { DashboardTab } from '@/components/SearchFilter/types';
import { PaDashboardItemStatus } from '@/routes/common/enums';
import { NotificationSeverity } from '@/storage/types';

const mocks = vi.hoisted(() => ({
    acquireTokenSilent: vi.fn(),
    deleteApplication: vi.fn(),
    setAuthToken: vi.fn(),
    setDashboardNotification: vi.fn(),
    trackGAEvent: vi.fn(),
    loggerError: vi.fn(),
}));

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: [{ homeAccountId: 'account-id' }],
        instance: {
            acquireTokenSilent: mocks.acquireTokenSilent,
        },
    }),
}));

vi.mock('@/analytics/GoogleAnalytics', () => ({
    trackGAEvent: mocks.trackGAEvent,
}));

vi.mock('@/instrumentation/AppLogger', () => ({
    default: {
        error: mocks.loggerError,
    },
}));

vi.mock('@/storage/notification', async (importOriginal) => {
    const actual = await importOriginal<typeof NotificationModule>();
    return {
        ...actual,
        setDashboardNotification: mocks.setDashboardNotification,
    };
});

vi.mock('@/api/web-api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();

    return {
        ...actual,
        ApplicationClient: vi.fn(function ApplicationClientMock() {
            return {
                deleteApplication: mocks.deleteApplication,
                setAuthToken: mocks.setAuthToken,
            };
        }),
    };
});

const LocationDisplay = () => {
    const location = useLocation();

    return <output aria-label='Current route'>{`${location.pathname}${location.search}`}</output>;
};

const baseRequest: PatternApprovalDashboardDetailsDto = {
    referenceId: 'NMI-PA-2024-001',
    portalReferenceId: 'PA-2024-0001',
    status: PaDashboardItemStatus.PaSubmitted,
    title: 'Pattern approval for flow meter',
    // PatternApprovalDashboardDetailsDto.lastUpdated is `string | undefined` - the
    // wire format. formattedDate() calls new Date() on it, so this ISO string is the
    // same instant the previous Date object represented and renders identically.
    lastUpdated: '2024-03-15T00:00:00Z',
    statusDetail: 'Under technical review',
    summary: 'Approval for a custody transfer flow meter',
    appliedFor: 'Pattern approval certificate',
    assessedAs: 'Instrument pattern',
    unreadMessageCount: 2,
};

const renderPaRequestItem = (
    request: PatternApprovalDashboardDetailsDto,
    tab = DashboardTab.Requests,
    setDeleteSuccess = vi.fn(),
) => render(
    <MemoryRouter initialEntries={['/dashboard']}>
        <PaRequestItem request={request} tab={tab} setDeleteSuccess={setDeleteSuccess} />
        <LocationDisplay />
    </MemoryRouter>,
);

describe('PaRequestItem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
        mocks.deleteApplication.mockResolvedValue(undefined);
    });

    it('routes submitted applications to details and messages with unread message context', async () => {
        const user = userEvent.setup();
        renderPaRequestItem(baseRequest);

        expect(screen.getByRole('heading', { name: 'Pattern approval for flow meter' })).toBeInTheDocument();
        expect(screen.getByText('NMI-PA-2024-001')).toBeInTheDocument();
        expect(screen.getByText('15 Mar 2024')).toBeInTheDocument();
        expect(screen.getByTitle('2 unread messages')).toBeInTheDocument();
        expect(within(screen.getByTitle('2 unread messages')).getByText('2')).toHaveAttribute('role', 'status');

        await user.click(screen.getByRole('button', { name: 'View application details' }));
        expect(screen.getByRole('status', { name: 'Current route' })).toHaveTextContent('/ta/PA-2024-0001/manage');
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('Application item/view details');

        await user.click(screen.getByRole('button', { name: /messages/i }));
        expect(screen.getByRole('status', { name: 'Current route' })).toHaveTextContent('/ta/PA-2024-0001/manage?tab=messages');
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('Application item/view messages');

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        expect(await screen.findByRole('link', { name: 'View application details' }))
            .toHaveAttribute('href', '/ta/PA-2024-0001/manage');
        await user.click(screen.getByRole('link', { name: 'View application details' }));
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('Viewapplicationdetails');
    });

    it.each([
        PaDashboardItemStatus.PaSubmitted,
        PaDashboardItemStatus.PaInProgress,
        PaDashboardItemStatus.PaOnHold,
        PaDashboardItemStatus.PaCompleted,
    ])('offers details and messages actions for %s applications', async (status) => {
        const user = userEvent.setup();
        renderPaRequestItem({
            ...baseRequest,
            status,
            portalReferenceId: `PA-${status}`,
        });

        await user.click(screen.getByRole('button', { name: 'Actions' }));

        expect(await screen.findByRole('link', { name: 'View application details' }))
            .toHaveAttribute('href', `/ta/PA-${status}/manage`);
        expect(screen.getByRole('button', { name: 'View messages' })).toBeInTheDocument();
    });

    it('resumes draft applications and deletes them after confirmation', async () => {
        const user = userEvent.setup();
        const setDeleteSuccess = vi.fn();

        renderPaRequestItem({
            ...baseRequest,
            status: PaDashboardItemStatus.PaDraft,
            title: undefined,
            lastUpdated: undefined,
            unreadMessageCount: undefined,
        }, DashboardTab.Drafts, setDeleteSuccess);

        expect(screen.getByRole('heading', { name: 'Draft request for Quote' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /messages/i })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Resume application' }));
        expect(screen.getByRole('status', { name: 'Current route' })).toHaveTextContent('/ta/PA-2024-0001');
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('Application item/resume application');

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        const resumeAction = await screen.findByRole('link', { name: 'Resume application' });
        expect(resumeAction).toHaveAttribute('href', '/ta/PA-2024-0001');
        await user.click(resumeAction);
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('Editapplication');

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(screen.getByRole('button', { name: 'Delete application' }));

        expect(screen.getByRole('dialog', { name: 'Confirm deletion' })).toHaveTextContent('PA-2024-0001');
        await user.click(screen.getByRole('button', { name: 'Yes, delete application' }));

        await waitFor(() => expect(setDeleteSuccess).toHaveBeenCalledWith(true));
        expect(mocks.acquireTokenSilent).toHaveBeenCalledWith(expect.objectContaining({
            account: { homeAccountId: 'account-id' },
        }));
        expect(mocks.setAuthToken).toHaveBeenCalledWith('access-token');
        expect(mocks.deleteApplication).toHaveBeenCalledWith('PA-2024-0001', {
            applicationType: ApplicationType.PatternApproval,
        });
        expect(mocks.setDashboardNotification).toHaveBeenCalledWith({
            message: 'The draft request has been successfully deleted',
            severity: NotificationSeverity.Success,
        });
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('Deleteapplication');
    });

    it('logs and closes the confirmation modal when draft deletion fails', async () => {
        const user = userEvent.setup();
        const setDeleteSuccess = vi.fn();
        const deleteError = new Error('delete failed');
        mocks.deleteApplication.mockRejectedValue(deleteError);

        renderPaRequestItem({
            ...baseRequest,
            status: PaDashboardItemStatus.PaDraft,
        }, DashboardTab.Drafts, setDeleteSuccess);

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(await screen.findByRole('button', { name: 'Delete application' }));
        await user.click(screen.getByRole('button', { name: 'Yes, delete application' }));

        await waitFor(() => expect(mocks.loggerError).toHaveBeenCalledWith(
            'Failed to delete application: PA-2024-0001',
            deleteError,
        ));
        expect(setDeleteSuccess).not.toHaveBeenCalled();
        expect(mocks.setDashboardNotification).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog', { name: 'Confirm deletion' })).not.toBeInTheDocument();
    });

    it('uses the manage route and zero-message state for unrecognised non-draft statuses', async () => {
        const user = userEvent.setup();
        const { container } = renderPaRequestItem({
            ...baseRequest,
            status: 'Archived',
            unreadMessageCount: undefined,
        });
        const card = container.querySelector('#RefId-PA-2024-0001');

        expect(card).toHaveAttribute('aria-labelledby', 'card-summary-PA-2024-0001');
        fireEvent.focus(card as HTMLElement);
        await waitFor(() => expect(card).toHaveAttribute('aria-labelledby', ''));
        fireEvent.blur(card as HTMLElement);
        await waitFor(() => expect(card).toHaveAttribute('aria-labelledby', 'card-summary-PA-2024-0001'));

        expect(screen.getByTitle('0 unread messages')).toBeInTheDocument();
        expect(screen.queryByRole('status', { name: '0' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Resume application' }));
        expect(screen.getByRole('status', { name: 'Current route' })).toHaveTextContent('/ta/PA-2024-0001/manage');

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        expect(screen.queryByRole('link', { name: 'View application details' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete application' })).not.toBeInTheDocument();
    });
});
