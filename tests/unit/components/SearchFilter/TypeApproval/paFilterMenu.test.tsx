import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Dispatch, SetStateAction } from 'react';
import type { PatternApprovalDashboardDto } from '@/api/web-api-client';
import { PatternApprovalStatusEnumDto } from '@/api/web-api-client';
import type { AccountDispatchContext } from '@/authentication/accountContext';
import { DashboardTab } from '@/components/SearchFilter/types';
import PaFilterMenu from '@/components/SearchFilter/TypeApproval/paFilterMenu';
import type { FieldHookConfig } from 'formik';
import type { RadioButtonGroupProps } from '@/components/Inputs/RadioButtonGroup/types';

const mocks = vi.hoisted(() => ({
  setUserProfile: vi.fn<AccountDispatchContext['setUserProfile']>(),
  trackGAEvent: vi.fn<(label: string, evtCategory?: string) => void>(),
}));

vi.mock(
  '@/authentication/hooks',
  () =>
    ({
      useAccountDispatch: () => ({
        setUserProfile: mocks.setUserProfile,
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  '@/analytics/GoogleAnalytics',
  () =>
    ({
      trackGAEvent: mocks.trackGAEvent,
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  '@/components/Inputs/RadioButtonGroup',
  () =>
    ({
      default: <T,>({
        legend,
        name,
        options,
        onChange,
        disabled,
      }: Readonly<
        RadioButtonGroupProps<T> & FieldHookConfig<T> & { disabled?: boolean }
      >) => (
        <fieldset>
          <legend>{legend}</legend>
          {options.map((option) => (
            <label key={String(option.value)} htmlFor={option.id}>
              <input
                id={option.id}
                type='radio'
                name={name}
                value={String(option.value)}
                disabled={disabled}
                onChange={onChange}
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      ),
    }) satisfies __ExactMockModule<__TestMockModule52>,
);

const renderMenu = (
  initialFilters: PatternApprovalDashboardDto | undefined,
  setInitialFilters = vi.fn<
    Dispatch<SetStateAction<PatternApprovalDashboardDto | undefined>>
  >(),
  setCurrentPage = vi.fn<Dispatch<SetStateAction<number>>>(),
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

const expectTrackedEvents = (events: readonly string[]) => {
  for (const event of events) {
    expect(mocks.trackGAEvent).toHaveBeenCalledWith(event);
  }
};

describe('PaFilterMenu', () => {
  const resetMocks = () => {
    mocks.setUserProfile.mockReset();
    mocks.trackGAEvent.mockReset();
  };

  it('shows no applied filters when the initial filters are undefined', async () => {
    expect.hasAssertions();
    resetMocks();

    renderMenu(undefined);

    const toggle = screen.getByRole('button', { name: /Filters.*applied/i });

    expect(toggle).toHaveAttribute('title', 'No filters applied');
    expect(within(toggle).getByRole('status')).toHaveTextContent('');

    await userEvent.click(toggle);

    expect(document.querySelector('[aria-label="Filter Menu"]')).toHaveClass(
      'filter-menu',
      'show',
    );
    expect(mocks.trackGAEvent).toHaveBeenCalledWith('search-filter-dropdown');
  });

  it('counts changed year, status, and sort filters in the toggle title', () => {
    expect.hasAssertions();
    resetMocks();

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
    expect.hasAssertions();
    resetMocks();

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

    await user.click(
      screen.getByRole('radio', { name: 'On hold - waiting on customer' }),
    );
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
    expect(mocks.setUserProfile).toHaveBeenCalledWith({
      patternApprovalDashboard: expectedFilters,
    });
    expectTrackedEvents(['FilterStatusType', 'Filteryeartype', 'ApplyFilter']);
  });

  it('counts nothing when the changed flag is set but every value is still the default', () => {
    expect.hasAssertions();
    resetMocks();

    // Filters changed and then changed back leave the flag set while the values match the
    // defaults again, so the count has to compare each value rather than just check it is set.
    renderMenu({
      filterYearType: 'allYears',
      filterStatusType: 'allStatuses',
      filterSortOrder: 'descending',
      filtersChanged: true,
    });

    const toggle = screen.getByRole('button', { name: /Filters.*applied/i });

    expect(toggle).toHaveAttribute('title', '0 filters have been applied');
    expect(within(toggle).getByRole('status')).toHaveTextContent('0');
  });

  it('treats a year-only change as a change even with the status left alone', async () => {
    expect.hasAssertions();
    resetMocks();

    // The applied flag is an either-or: leaving the status at its default must not mask a
    // year that did change.
    const initialFilters: PatternApprovalDashboardDto = {
      filterYearType: 'allYears',
      filterStatusType: 'allStatuses',
      filterSortOrder: 'descending',
      filtersChanged: false,
      filterActiveTab: DashboardTab.Requests,
      filterSearchText: '',
    };
    const { setInitialFilters } = renderMenu(initialFilters);
    const user = await openMenu();

    await user.click(screen.getByRole('radio', { name: 'Within 2 years' }));
    await user.click(screen.getByRole('button', { name: 'Show results' }));

    expect(setInitialFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        filterYearType: 'withintwoyears',
        filterStatusType: 'allStatuses',
        filtersChanged: true,
      }),
    );
  });

  it('resets filters to defaults while preserving the active tab and search text', async () => {
    expect.hasAssertions();
    resetMocks();

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
    expect(mocks.setUserProfile).toHaveBeenCalledWith({
      patternApprovalDashboard: expectedFilters,
    });
    expect(mocks.trackGAEvent).toHaveBeenCalledWith('ResetFilter');
  });

  it('closes without applying filters when cancel is selected', async () => {
    expect.hasAssertions();
    resetMocks();

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

  it('discards unapplied edits when the menu is dismissed', async () => {
    expect.hasAssertions();
    resetMocks();

    // Dismissing the dropdown routes through onToggle, which clicks the hidden close button so
    // the same teardown runs however the menu was left - otherwise edits made and abandoned
    // would still be sitting there the next time it opens.
    const { setInitialFilters } = renderMenu({
      filterYearType: 'olderthantwoyears',
      filterStatusType: PatternApprovalStatusEnumDto.Completed,
      filtersChanged: true,
    });
    const user = await openMenu();

    await user.click(screen.getByRole('button', { name: /Filters.*applied/i }));

    expect(mocks.trackGAEvent).toHaveBeenCalledWith('CloseFilter');
    expect(setInitialFilters).not.toHaveBeenCalled();
  });

  it('disables status options for draft pattern approval dashboard filters', async () => {
    expect.hasAssertions();
    resetMocks();

    renderMenu({
      filterYearType: 'allYears',
      filterStatusType: 'allStatuses',
      filtersChanged: false,
      filterActiveTab: DashboardTab.Drafts,
    });

    await openMenu();

    expect(
      screen.getByRole('radio', { name: 'Show all statuses' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('radio', { name: 'Show all years' }),
    ).not.toBeDisabled();
  });
});
