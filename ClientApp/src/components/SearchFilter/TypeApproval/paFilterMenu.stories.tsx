import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import type { PatternApprovalDashboardDto } from '../../../api/web-api-client';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import PaFilterMenu from './paFilterMenu';

/**
 * `PaFilterMenu` is the pattern-approval dashboard filter dropdown. It mirrors the
 * testing/calibration `FilterMenu` but exposes PA-specific status options (On hold,
 * In progress, Completed) and persists selections to the pattern-approval slice of
 * the user profile.
 */
const initialFilters: PatternApprovalDashboardDto = {
    filterStatusType: 'allStatuses',
    filterYearType: 'allYears',
    filterSortOrder: 'descending',
    filtersChanged: false,
    filterCurrentPage: 1,
    filterActiveTab: 'requests',
    filterSearchText: '',
};

const meta = {
    title: 'Components/SearchFilter/TypeApproval/PaFilterMenu',
    component: PaFilterMenu,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
        portal: {
            authenticated: true,
        },
    },
    args: {
        initialFilters,
        setInitialFilters: fn(),
        setCurrentPage: fn(),
    },
} satisfies Meta<typeof PaFilterMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: /filters/i })).toBeVisible();
    },
};

export const Opened: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();
        await user.click(canvas.getByRole('button', { name: /filters/i }));
        await expect(await canvas.findByText('In progress - with NMI')).toBeVisible();
    },
};
