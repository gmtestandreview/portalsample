import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import { defaultUserProfile, withPortalProviders } from '../../storybook/storybookHarness';
import FilterMenu from './filterMenu';

/**
 * `FilterMenu` is the testing/calibration dashboard filter dropdown. Its toggle shows
 * a count badge when non-default filters are applied; opening it reveals a Formik form
 * with status/year radio groups and Reset/Cancel/Show-results actions. It reads the
 * account dispatch context to persist the chosen filters to the user profile.
 */
const meta = {
    title: 'Components/SearchFilter/FilterMenu',
    component: FilterMenu,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
        portal: {
            authenticated: true,
        },
    },
    args: {
        initialFilters: defaultUserProfile,
        setInitialFilters: fn(),
        setCurrentPage: fn(),
    },
} satisfies Meta<typeof FilterMenu>;

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
        // The radio groups render once the menu is open.
        await expect(await canvas.findByText('Show results')).toBeVisible();
        await expect(canvas.getByText('Quote offer is available')).toBeVisible();
    },
};

export const WithAppliedFilters: Story = {
    args: {
        initialFilters: {
            ...defaultUserProfile,
            filterStatusType: 'QuoteAvailable',
            filtersChanged: true,
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Applied-filter count badge surfaces a non-zero value.
        await expect(canvas.getByText('1')).toBeVisible();
    },
};
