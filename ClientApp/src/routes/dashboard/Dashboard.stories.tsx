import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent, fn, waitFor } from 'storybook/test';
import type { ComponentType } from 'react';
import { useEffect } from 'react';
import { http, HttpResponse } from 'msw';
import Dashboard from './index';
import { DashboardTab } from '../../components/SearchFilter/types';
import { withPortalProviders } from '../../storybook/storybookHarness';
import { dashboardItems } from '../../storybook/storybookFixtures';
import { DashboardItemStatus } from '../common/enums';
import { setDashboardNotification, clearDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import NotificationMessage from '../../components/Alert/NotificationMessage';

const draftItems = dashboardItems.filter((item) => item.status === DashboardItemStatus.QuoteDrafted);
const requestItems = dashboardItems.filter((item) => item.status !== DashboardItemStatus.ReportIssued);
const instrumentItems = dashboardItems.filter((item) => item.status === DashboardItemStatus.ReportIssued);

const buildDashboardResponse = (items = dashboardItems) => HttpResponse.json({
    items,
    currentPage: 1,
    totalPages: 1,
    totalCount: items.length,
});

const emptyDraftsResponse = fn(() => buildDashboardResponse([]));

const NotificationDecorator = (Story: ComponentType) => {
    setDashboardNotification({
        message: 'Quote request saved as draft.',
        severity: NotificationSeverity.Success,
    });

    useEffect(() => {
        return () => clearDashboardNotification();
    }, []);

    return (
        <>
            <NotificationMessage
                canClose
                message='Quote request saved as draft.'
                severity={NotificationSeverity.Success}
            />
            <Story />
        </>
    );
};

const meta = {
    title: 'Routes/Dashboard',
    component: Dashboard,
    decorators: [withPortalProviders],
    beforeEach({ msw }) {
        msw.use(
            http.get('/api/dashboard/get-filtered-dashboard-drafts', () => buildDashboardResponse(draftItems)),
            http.get('/api/dashboard/get-filtered-dashboard-quotes', () => buildDashboardResponse(requestItems)),
            http.get('/api/dashboard/get-filtered-dashboard-artefacts', () => buildDashboardResponse(instrumentItems)),
        );
    },
    parameters: {
        layout: 'fullscreen',
        portal: {
            initialEntries: ['/dashboard'],
            accountDetails: {
                userProfile: {
                    testingCalibrationDashboard: {
                        filterYearType: '',
                        filterStatusType: '',
                        filterSortOrder: 'descending',
                        filtersChanged: false,
                        filterCurrentPage: 1,
                        filterActiveTab: DashboardTab.Drafts,
                        filterSearchText: '',
                    },
                },
            },
        },
    },
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const tabList = await canvas.findByRole('tablist', { name: 'Select your dashboard view' });
        await expect(tabList).toBeVisible();
        await expect(await canvas.findByRole('heading', { name: 'Fluke 87V' })).toBeVisible();
    },
};

export const EmptyState: Story = {
    beforeEach({ msw }) {
        msw.use(
            http.get('/api/dashboard/get-filtered-dashboard-drafts', emptyDraftsResponse),
            http.get('/api/dashboard/get-filtered-dashboard-quotes', () => buildDashboardResponse([])),
            http.get('/api/dashboard/get-filtered-dashboard-artefacts', () => buildDashboardResponse([])),
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The empty message also exists before loading starts, so first wait for the request.
        await waitFor(() => expect(emptyDraftsResponse).toHaveBeenCalled());
        await waitFor(() => expect(canvas.queryByText('Loading data...')).not.toBeInTheDocument());
        const noRequestsTexts = await canvas.findAllByText(/you currently have no requests/i);
        await expect(noRequestsTexts[0]).toBeVisible();
    },
};

export const RequestsTabWithNotification: Story = {
    decorators: [NotificationDecorator],
    parameters: {
        portal: {
            initialEntries: ['/dashboard'],
            accountDetails: {
                userProfile: {
                    testingCalibrationDashboard: {
                        filterYearType: '',
                        filterStatusType: '',
                        filterSortOrder: 'descending',
                        filtersChanged: false,
                        filterCurrentPage: 1,
                        filterActiveTab: DashboardTab.Requests,
                        filterSearchText: 'Keysight',
                    },
                },
            },
        },
    },
    // SB-016: notification renders and dismiss button is present
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const notifications = await canvas.findAllByText(/quote request saved as draft/i);
        await waitFor(() => expect(canvas.getByRole('heading', { name: /Keysight U1242C/ })).toBeVisible());
        await expect(notifications[0]).toBeVisible();
        // Dismiss button exists (NotificationMessage renders a close × button when dismissible)
        const dismissButtons = canvas.queryAllByRole('button', { name: /close|dismiss/i });
        await expect(dismissButtons[0]).toBeInTheDocument();
    },
};

// SB-016: clicking a tab changes the visible tab panel
export const TabNavigation: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();
        await expect(await canvas.findByRole('heading', { name: 'Fluke 87V' })).toBeVisible();
        const tabList = await canvas.findByRole('tablist', { name: 'Select your dashboard view' });
        await expect(tabList).toBeVisible();
        // Three tabs are present
        const tabs = within(tabList).getAllByRole('tab');
        await expect(tabs.length).toBeGreaterThanOrEqual(2);
        // Click the second tab and assert it becomes selected
        await user.click(tabs[1]);
        await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
        await waitFor(() => expect(canvas.getByRole('heading', { name: /Keysight U1242C/ })).toBeVisible());
    },
};
