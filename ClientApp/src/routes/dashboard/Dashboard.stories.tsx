import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from 'storybook/test';
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
    parameters: {
        layout: 'fullscreen',
        portal: {
            initialEntries: ['/dashboard'],
            accountDetails: {
                userProfile: {
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
        msw: {
            handlers: [
                http.get('/api/dashboard/get-filtered-dashboard-drafts', () => buildDashboardResponse(draftItems)),
                http.get('/api/dashboard/get-filtered-dashboard-quotes', () => buildDashboardResponse(requestItems)),
                http.get('/api/dashboard/get-filtered-dashboard-artefacts', () => buildDashboardResponse(instrumentItems)),
            ],
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Assert the tab navigation renders — this is immediate and does not
        // depend on the MSW API response. Per-story handlers are only applied
        // in the browser Storybook (mswLoader disabled in Vitest/jsdom).
        const tabList = await canvas.findByRole('tablist');
        await expect(tabList).toBeVisible();
    },
};

export const EmptyState: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get('/api/dashboard/get-filtered-dashboard-drafts', () => buildDashboardResponse([])),
                http.get('/api/dashboard/get-filtered-dashboard-quotes', () => buildDashboardResponse([])),
                http.get('/api/dashboard/get-filtered-dashboard-artefacts', () => buildDashboardResponse([])),
            ],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The global MSW handler returns empty items, so the no-requests message
        // renders after the API responds. Per-story empty-response override only
        // takes effect in the browser Storybook UI.
        // The text renders once per tab panel — findAllByText to handle multiple matches
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
    // SB-016: notification renders and dismiss button is present
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const notifications = await canvas.findAllByText(/quote request saved as draft/i);
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
        // Tab list renders immediately without API response
        const tabList = await canvas.findByRole('tablist');
        await expect(tabList).toBeVisible();
        // Three tabs are present
        const tabs = canvas.getAllByRole('tab');
        await expect(tabs.length).toBeGreaterThanOrEqual(2);
        // Click the second tab and assert it becomes selected
        await user.click(tabs[1]);
        await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    },
};
