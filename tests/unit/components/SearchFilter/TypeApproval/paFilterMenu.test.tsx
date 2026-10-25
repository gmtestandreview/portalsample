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

vi.mock(
  import('@/authentication/hooks'),
  () =>
    ({
      useAccountDispatch: () => ({
        setUserProfile: mocks.setUserProfile,
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: mocks.trackGAEvent,
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  import('@/components/Inputs/RadioButtonGroup'),
  () =>
    ({
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
    }) satisfies __ExactMockModule<__TestMockModule52>,
);

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

describe(PaFilterMenu, () => {
  beforeEach(() => {
    mocks.setUserProfile.mockReset();
    mocks.trackGAEvent.mockReset();
  });
  it('shows no applied filters when the initial filters are undefined', async () => {
    expect.assertions(4);
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
});
