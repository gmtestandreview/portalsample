import { describe, beforeEach, it, expect } from 'vitest';

import { render, screen, within } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import SearchFilter from '@/components/SearchFilter';

import FilterMenu from '@/components/SearchFilter/filterMenu';

import SearchBox from '@/components/SearchFilter/searchBox';

import {
  DashboardTab,
  type UserProfile,
} from '@/components/SearchFilter/types';

import { StatusEnumDto } from '@/api/web-api-client';

import { defined } from '../helpers/defined';

const accountDispatchMock = vi.hoisted(() => ({
  setUserProfile: vi.fn(),
}));

vi.mock(
  import('@/authentication/hooks'),
  () =>
    ({
      useAccountDispatch: () => accountDispatchMock,
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

const defaultFilters: UserProfile = {
  filterYearType: 'allYears',
  filterStatusType: 'allStatuses',
  filtersChanged: false,
  filterSortOrder: 'descending',
  filterCurrentPage: 3,
  filterActiveTab: DashboardTab.Requests,
  filterSearchText: '',
};

describe('searchFilter behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('submits and clears SearchBox keywords through the public callback', async () => {
    expect.assertions(5);
    const user = userEvent.setup();
    const onSearchSubmit = vi.fn();
    render(
      <SearchBox
        onSearchSubmit={onSearchSubmit}
        initialSearchValue='balance'
        placeholder='Search requests'
      />,
    );

    const input = screen.getByRole('textbox', {
      name: 'Type keyword and press Enter key to search.',
    });

    expect(input).toHaveValue('balance');

    await user.clear(input);

    expect(onSearchSubmit).toHaveBeenLastCalledWith(undefined);
    expect(input).toHaveFocus();

    await user.type(input, 'thermometer{Enter}');

    expect(onSearchSubmit).toHaveBeenLastCalledWith('thermometer');

    await user.click(screen.getByRole('button', { name: 'Clear keyword' }));

    expect(onSearchSubmit).toHaveBeenLastCalledWith(undefined);
  });
});
