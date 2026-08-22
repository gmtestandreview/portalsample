import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, fn } from 'storybook/test';
import type { PatternApprovalDashboardDto } from '../../../api/web-api-client';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import PaSearchFilter from './paSearchFilter';

/**
 * `PaSearchFilter` is the toolbar that composes the pattern-approval dashboard search
 * and filtering. It currently renders the `PaFilterMenu` dropdown (the keyword search
 * box is staged behind it) and wires both to the pattern-approval user-profile slice.
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
    title: 'Components/SearchFilter/TypeApproval/PaSearchFilter',
    component: PaSearchFilter,
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
    tags: ['autodocs'],
} satisfies Meta<typeof PaSearchFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: /filters/i })).toBeVisible();
    },
};
