import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { PatternApprovalDashboardDto } from '@/api/web-api-client';
import { PatternApprovalStatusEnumDto } from '@/api/web-api-client';
import { DashboardTab } from '@/components/SearchFilter/types';
import PaFilterMenu from '@/components/SearchFilter/TypeApproval/paFilterMenu';

const mocks = vi.hoisted(() => ({
    setUserProfile: vi.fn(),
    trackGAEvent: vi.fn(),
}));

vi.mock('@/authentication/hooks', () => ({
    useAccountDispatch: () => ({
        setUserProfile: mocks.setUserProfile,
    }),
}));

vi.mock('@/analytics/GoogleAnalytics', () => ({
    trackGAEvent: mocks.trackGAEvent,
}));

vi.mock('@/components/Inputs/RadioButtonGroup', () => ({
    default: ({
        legend,
        name,
        options,
        onChange,
        disabled,
    }: {
        legend: string;
        name: string;
        options: { id?: string; label: string; value: string }[];
        onChange: React.ChangeEventHandler<HTMLInputElement>;
        disabled?: boolean;
    }) => (
        <fieldset>
            <legend>{legend}</legend>
            {options.map((option) => (
                <label key={option.value} htmlFor={option.id}>
                    <input
                        id={option.id}
                        type='radio'
                        name={name}
                        value={option.value}
                        disabled={disabled}
                        onChange={onChange}
                    />
                    {option.label}
                </label>
            ))}
        </fieldset>
    ),
}));

const renderMenu = (
    initialFilters: PatternApprovalDashboardDto | undefined,
    setInitialFilters = vi.fn(),
    setCurrentPage = vi.fn(),
) => {
    render(
        <PaFilterMenu
            containerClassName='filter-shell'
            initialFilters={initialFilters}
            setInitialFilters={setInitialFilters}
            setCurrentPage={setCurrentPage}
        />,
    );

    return { setInitialFilters, setCurrentPage };
};

const openMenu = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Filters.*applied/i }));
    return user;
};

describe('PaFilterMenu', () => {
    beforeEach(() => {
        mocks.setUserProfile.mockReset();
        mocks.trackGAEvent.mockReset();
    });

    it('shows no applied filters when the initial filters are undefined', async () => {
        renderMenu(undefined);

        const toggle = screen.getByRole('button', { name: /Filters.*applied/i });
        expect(toggle).toHaveAttribute('title', 'No filters applied');
        expect(within(toggle).getByRole('status')).toHaveTextContent('');

        await userEvent.click(toggle);

        expect(document.querySelector('[aria-label="Filter Menu"]')).toHaveClass('filter-menu', 'show');
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('search-filter-dropdown');
    });

    it('counts changed year, status, and sort filters in the toggle title', () => {
        renderMenu({
            filterYearType: 'withintwoyears',
            filterStatusType: PatternApprovalStatusEnumDto.OnHold,
            filterSortOrder: 'ascending',
            filtersChanged: true,
        });

        const toggle = screen.getByRole('button', { name: /Filters.*applied/i });
        expect(toggle).toHaveAttribute('title', '3 filters have been applied');
        expect(within(toggle).getByRole('status')).toHaveTextContent('3');
    });

    it('applies changed filters, resets paging, and saves the pattern approval dashboard profile', async () => {
        const initialFilters: PatternApprovalDashboardDto = {
            filterYearType: 'allYears',
            filterStatusType: 'allStatuses',
            filterSortOrder: 'descending',
            filtersChanged: false,
            filterActiveTab: DashboardTab.Requests,
            filterSearchText: 'pattern',
        };
        const { setInitialFilters, setCurrentPage } = renderMenu(initialFilters);
        const user = await openMenu();

        await user.click(screen.getByRole('radio', { name: 'On hold - waiting on customer' }));
        await user.click(screen.getByRole('radio', { name: 'Within 2 years' }));
        await user.click(screen.getByRole('button', { name: 'Show results' }));

        const expectedFilters = {
            filterYearType: 'withintwoyears',
            filterStatusType: PatternApprovalStatusEnumDto.OnHold,
            filtersChanged: true,
            filterSortOrder: 'descending',
            filterCurrentPage: 1,
            filterActiveTab: DashboardTab.Requests,
            filterSearchText: 'pattern',
        };
        expect(setCurrentPage).toHaveBeenCalledWith(1);
        expect(setInitialFilters).toHaveBeenCalledWith(expectedFilters);
        expect(mocks.setUserProfile).toHaveBeenCalledWith({ patternApprovalDashboard: expectedFilters });
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('FilterStatusType');
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('Filteryeartype');
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('ApplyFilter');
    });

    it('resets filters to defaults while preserving the active tab and search text', async () => {
        const initialFilters: PatternApprovalDashboardDto = {
            filterYearType: 'olderthantwoyears',
            filterStatusType: PatternApprovalStatusEnumDto.Completed,
            filterSortOrder: 'ascending',
            filtersChanged: true,
            filterActiveTab: DashboardTab.Instruments,
            filterSearchText: 'certificate',
        };
        const { setInitialFilters, setCurrentPage } = renderMenu(initialFilters);
        const user = await openMenu();

        await user.click(screen.getByRole('button', { name: 'Reset' }));

        const expectedFilters = {
            filterYearType: 'allYears',
            filterStatusType: 'allStatuses',
            filtersChanged: false,
            filterCurrentPage: 1,
            filterActiveTab: DashboardTab.Instruments,
            filterSearchText: 'certificate',
        };
        expect(setCurrentPage).toHaveBeenCalledWith(1);
        expect(setInitialFilters).toHaveBeenCalledWith(expectedFilters);
        expect(mocks.setUserProfile).toHaveBeenCalledWith({ patternApprovalDashboard: expectedFilters });
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('ResetFilter');
    });

    it('closes without applying filters when cancel is selected', async () => {
        const { setInitialFilters, setCurrentPage } = renderMenu({
            filterYearType: 'olderthantwoyears',
            filterStatusType: PatternApprovalStatusEnumDto.Completed,
            filtersChanged: true,
        });
        const user = await openMenu();

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(setInitialFilters).not.toHaveBeenCalled();
        expect(setCurrentPage).not.toHaveBeenCalled();
        expect(mocks.setUserProfile).not.toHaveBeenCalled();
        expect(mocks.trackGAEvent).toHaveBeenCalledWith('CancelFilter');
    });

    it('disables status options for draft pattern approval dashboard filters', async () => {
        renderMenu({
            filterYearType: 'allYears',
            filterStatusType: 'allStatuses',
            filtersChanged: false,
            filterActiveTab: DashboardTab.Drafts,
        });

        await openMenu();

        expect(screen.getByRole('radio', { name: 'Show all statuses' })).toBeDisabled();
        expect(screen.getByRole('radio', { name: 'Show all years' })).not.toBeDisabled();
    });
});
