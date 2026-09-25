import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchFilter from '@/components/SearchFilter';
import FilterMenu from '@/components/SearchFilter/filterMenu';
import SearchBox from '@/components/SearchFilter/searchBox';
import { DashboardTab, type UserProfile } from '@/components/SearchFilter/types';
import { StatusEnumDto } from '@/api/web-api-client';

const accountDispatchMock = vi.hoisted(() => ({
    setUserProfile: vi.fn(),
}));

vi.mock('@/authentication/hooks', () => ({
    useAccountDispatch: () => accountDispatchMock,
}));

vi.mock('@/analytics/GoogleAnalytics', () => ({
    trackGAEvent: vi.fn(),
}));

const defaultFilters: UserProfile = {
    filterYearType: 'allYears',
    filterStatusType: 'allStatuses',
    filtersChanged: false,
    filterSortOrder: 'descending',
    filterCurrentPage: 3,
    filterActiveTab: DashboardTab.Requests,
    filterSearchText: '',
};

describe('SearchFilter behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('submits and clears SearchBox keywords through the public callback', async () => {
        const user = userEvent.setup();
        const onSearchSubmit = vi.fn();
        render(
            <SearchBox
                onSearchSubmit={onSearchSubmit}
                initialSearchValue='balance'
                placeholder='Search requests'
            />,
        );

        const input = screen.getByRole('textbox', { name: 'Type keyword and press Enter key to search.' });
        expect(input).toHaveValue('balance');

        await user.clear(input);
        expect(onSearchSubmit).toHaveBeenLastCalledWith(undefined);
        expect(input).toHaveFocus();

        await user.type(input, 'thermometer{Enter}');
        expect(onSearchSubmit).toHaveBeenLastCalledWith('thermometer');

        await user.click(screen.getByRole('button', { name: 'Clear keyword' }));
        expect(onSearchSubmit).toHaveBeenLastCalledWith(undefined);
    });

    it('renders the leading search icon as decorative markup without a presentation role', () => {
        const { container } = render(
            <SearchBox
                onSearchSubmit={vi.fn()}
                placeholder='Search requests'
            />,
        );

        const searchIcon = container.querySelector('#search-icon i');
        expect(searchIcon).not.toBeNull();
        expect(searchIcon).toHaveAttribute('aria-hidden', 'true');
        expect(searchIcon).not.toHaveAttribute('role');
    });

    it('opens FilterMenu, applies selected options, and persists the profile', async () => {
        const user = userEvent.setup();
        const setInitialFilters = vi.fn();
        const setCurrentPage = vi.fn();
        render(
            <FilterMenu
                initialFilters={defaultFilters}
                setInitialFilters={setInitialFilters}
                setCurrentPage={setCurrentPage}
            />,
        );

        await user.click(screen.getByRole('button', { name: /filters/i }));
        const menu = screen.getByLabelText('Filter Menu');

        await user.click(within(menu).getByLabelText('Quote offer is available'));
        await user.click(within(menu).getByLabelText('Previous year - 2024'));
        await user.click(screen.getByRole('button', { name: 'Show results' }));

        const expectedProfile = {
            filterYearType: '2024',
            filterStatusType: StatusEnumDto.QuoteAvailable,
            filtersChanged: true,
            filterSortOrder: 'descending',
            filterCurrentPage: 1,
            filterActiveTab: DashboardTab.Requests,
            filterSearchText: '',
        };
        expect(setCurrentPage).toHaveBeenCalledWith(1);
        expect(setInitialFilters).toHaveBeenCalledWith(expectedProfile);
        expect(accountDispatchMock.setUserProfile).toHaveBeenCalledWith({
            testingCalibrationDashboard: expectedProfile,
        });
        expect(screen.getByRole('button', { name: /filters/i })).toHaveAttribute('aria-expanded', 'false');
    });

    it('resets FilterMenu to default status and year while preserving active tab and search text', async () => {
        const user = userEvent.setup();
        const setInitialFilters = vi.fn();
        const setCurrentPage = vi.fn();
        const changedFilters: UserProfile = {
            ...defaultFilters,
            filterYearType: '2024',
            filterStatusType: StatusEnumDto.ReportIssued,
            filtersChanged: true,
            filterSearchText: 'balance',
        };

        render(
            <FilterMenu
                initialFilters={changedFilters}
                setInitialFilters={setInitialFilters}
                setCurrentPage={setCurrentPage}
            />,
        );

        await user.click(screen.getByRole('button', { name: /filters/i }));
        await user.click(screen.getByRole('button', { name: 'Reset' }));

        const expectedProfile = {
            filterYearType: 'allYears',
            filterStatusType: 'allStatuses',
            filtersChanged: false,
            filterCurrentPage: 1,
            filterActiveTab: DashboardTab.Requests,
            filterSearchText: 'balance',
        };
        expect(setCurrentPage).toHaveBeenCalledWith(1);
        expect(setInitialFilters).toHaveBeenCalledWith(expectedProfile);
        expect(accountDispatchMock.setUserProfile).toHaveBeenCalledWith({
            testingCalibrationDashboard: expectedProfile,
        });
    });

    it('closes FilterMenu without applying cancelled radio changes', async () => {
        const user = userEvent.setup();
        const setInitialFilters = vi.fn();
        render(
            <FilterMenu
                initialFilters={defaultFilters}
                setInitialFilters={setInitialFilters}
                setCurrentPage={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: /filters/i }));
        await user.click(screen.getByLabelText('Report is available'));
        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(setInitialFilters).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /filters/i })).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes FilterMenu from its close control and counts a changed sort order', async () => {
        const user = userEvent.setup();
        render(
            <FilterMenu
                initialFilters={{
                    ...defaultFilters,
                    filterYearType: '2024',
                    filterStatusType: StatusEnumDto.ReportIssued,
                    filterSortOrder: 'ascending',
                    filtersChanged: true,
                }}
                setInitialFilters={vi.fn()}
                setCurrentPage={vi.fn()}
            />,
        );

        const toggle = screen.getByRole('button', { name: /filters/i });
        expect(toggle).toHaveAttribute('title', '3 filters have been applied');
        await user.click(toggle);
        await user.click(screen.getByTestId('close-filter-button'));
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('counts only a changed sort order and closes when the toggle is pressed again', async () => {
        const user = userEvent.setup();
        render(
            <FilterMenu
                initialFilters={{
                    ...defaultFilters,
                    filterSortOrder: 'ascending',
                    filtersChanged: true,
                }}
                setInitialFilters={vi.fn()}
                setCurrentPage={vi.fn()}
            />,
        );

        const toggle = screen.getByRole('button', { name: /filters/i });
        expect(toggle).toHaveAttribute('title', '1 filters have been applied');
        await user.click(toggle);
        await user.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('falls back to default filter values when no initial profile is supplied', async () => {
        const user = userEvent.setup();
        const setInitialFilters = vi.fn();
        render(
            <FilterMenu
                initialFilters={undefined}
                setInitialFilters={setInitialFilters}
                setCurrentPage={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: /filters/i }));
        await user.click(screen.getByRole('button', { name: 'Show results' }));

        expect(setInitialFilters).toHaveBeenCalledWith(expect.objectContaining({
            filterYearType: 'allYears',
            filterStatusType: 'allStatuses',
            filtersChanged: false,
        }));
    });

    it('disables status choices when filtering the instruments tab', async () => {
        const user = userEvent.setup();
        render(
            <FilterMenu
                initialFilters={{ ...defaultFilters, filterActiveTab: DashboardTab.Instruments }}
                setInitialFilters={vi.fn()}
                setCurrentPage={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: /filters/i }));

        expect(screen.getByLabelText('Show all statuses')).toBeDisabled();
        expect(screen.getByLabelText('Report is available')).toBeDisabled();
        expect(screen.getByLabelText('Current year - 2025')).toBeEnabled();
    });

    it('SearchFilter submits search text by resetting page and updating filters through the state updater', async () => {
        const user = userEvent.setup();
        const setCurrentPage = vi.fn();
        const setInitialFilters = vi.fn();
        render(
            <SearchFilter
                initialFilters={{ ...defaultFilters, filterCurrentPage: 4 }}
                setInitialFilters={setInitialFilters}
                setCurrentPage={setCurrentPage}
                placeholder='Search dashboard'
            />,
        );

        await user.type(screen.getByRole('textbox', { name: 'Type keyword and press Enter key to search.' }), 'caliper{Enter}');

        expect(setCurrentPage).toHaveBeenCalledWith(1);
        expect(setInitialFilters).toHaveBeenCalledWith(expect.any(Function));
        expect(setInitialFilters.mock.calls[0][0]({ ...defaultFilters, filterCurrentPage: 4 })).toEqual({
            ...defaultFilters,
            filterCurrentPage: 1,
            filterSearchText: 'caliper',
        });
        expect(accountDispatchMock.setUserProfile).toHaveBeenCalledWith({
            testingCalibrationDashboard: {
                filterYearType: 'allYears',
                filterStatusType: 'allStatuses',
                filtersChanged: false,
                filterCurrentPage: 1,
                filterActiveTab: DashboardTab.Requests,
                filterSearchText: 'caliper',
            },
        });
    });
});
