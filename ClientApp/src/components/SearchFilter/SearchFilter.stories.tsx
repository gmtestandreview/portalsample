import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import SearchFilter from './index';
import type { UserProfile } from './types';
import { DashboardTab } from './types';
import { withPortalProviders } from '../../storybook/storybookHarness';

const initialFilters: UserProfile = {
    filterYearType: '',
    filterStatusType: '',
    filterSortOrder: 'descending',
    filtersChanged: false,
    filterCurrentPage: 1,
    filterActiveTab: DashboardTab.Requests,
    filterSearchText: '',
};

const SearchFilterStory = () => {
    const [filters, setFilters] = useState<UserProfile | undefined>(initialFilters);
    const [page, setPage] = useState(1);

    return (
        <div className='py-4' style={{ minWidth: 960 }}>
            <SearchFilter
                initialFilters={filters}
                setInitialFilters={setFilters}
                setCurrentPage={setPage}
                placeholder='Search by manufacturer, model, serial...'
            />
            <p className='small mt-3 mb-0'>
                Current page:
                {' '}
                {page}
                {' | Search text: '}
                {filters?.filterSearchText || 'none'}
            </p>
        </div>
    );
};

const SearchFilterWithSearchTermStory = () => {
    const [filters, setFilters] = useState<UserProfile | undefined>({
        ...initialFilters,
        filterSearchText: 'Fluke',
    });
    const [page, setPage] = useState(1);
    return (
        <div className='py-4' style={{ minWidth: 960 }}>
            <SearchFilter
                initialFilters={filters}
                setInitialFilters={setFilters}
                setCurrentPage={setPage}
                placeholder='Search by manufacturer, model, serial...'
            />
            <p className='small mt-3 mb-0'>
                Current page:
                {' '}
                {page}
                {' | Search text: '}
                {filters?.filterSearchText || 'none'}
            </p>
        </div>
    );
};

const meta = {
    title: 'Components/SearchFilter',
    component: SearchFilter,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof SearchFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DashboardFilters: Story = {
    args: {
        initialFilters,
        setInitialFilters: () => undefined,
        setCurrentPage: () => undefined,
    },
    render: () => <SearchFilterStory />,
    // SB-020: search input is accessible and submits correctly
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();
        // Search box renders with a text input
        const searchInput = canvas.getByRole('textbox');
        await expect(searchInput).toBeVisible();
        // Typing and submitting updates the displayed filter state
        await user.clear(searchInput);
        await user.type(searchInput, 'Keysight');
        await user.keyboard('{Enter}');
        // The debug output below the component shows the current search text
        const searchLabel = await canvas.findByText(/Keysight/i);
        await expect(searchLabel).toBeVisible();
    },
};

// SB-020: pre-populated search term renders correctly
export const WithSearchTerm: Story = {
    args: {
        initialFilters: {
            ...initialFilters,
            filterSearchText: 'Fluke',
        },
        setInitialFilters: () => undefined,
        setCurrentPage: () => undefined,
    },
    render: () => <SearchFilterWithSearchTermStory />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Pre-populated value appears in the search box
        const searchInput = canvas.getByRole('textbox');
        await expect(searchInput).toHaveValue('Fluke');
        // Status line reflects it
        await expect(canvas.getByText(/Fluke/i)).toBeVisible();
    },
};
