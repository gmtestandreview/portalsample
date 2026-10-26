import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Dispatch, SetStateAction } from 'react';
import type { PatternApprovalDashboardDto } from '@/api/web-api-client';
import PaSearchFilter from '@/components/SearchFilter/TypeApproval/paSearchFilter';

vi.mock(
  '@/components/SearchFilter/TypeApproval/paFilterMenu',
  () =>
    ({
      default: ({
        initialFilters,
        setCurrentPage,
        setInitialFilters,
      }: {
        initialFilters: PatternApprovalDashboardDto;
        setCurrentPage: Dispatch<SetStateAction<number>>;
        setInitialFilters: Dispatch<
          SetStateAction<PatternApprovalDashboardDto | undefined>
        >;
      }) => (
        <button
          type='button'
          onClick={() => {
            setCurrentPage(1);
            setInitialFilters(initialFilters);
          }}
        >
          Filter applications
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule53>,
);

describe('PaSearchFilter', () => {
  it('renders the filter menu with default Bootstrap layout classes', () => {
    expect.hasAssertions();

    const initialFilters = { currentPage: 3 } as PatternApprovalDashboardDto;

    render(
      <PaSearchFilter
        initialFilters={initialFilters}
        setInitialFilters={vi.fn<
          Dispatch<SetStateAction<PatternApprovalDashboardDto | undefined>>
        >()}
        setCurrentPage={vi.fn<Dispatch<SetStateAction<number>>>()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Filter applications' }),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole('button', { name: 'Filter applications' })
        .closest('.container'),
    ).toHaveClass('container');
    expect(
      screen
        .getByRole('button', { name: 'Filter applications' })
        .closest('.row'),
    ).toHaveClass('row');
    expect(
      screen
        .getByRole('button', { name: 'Filter applications' })
        .closest('.col'),
    ).toHaveClass('d-flex', 'justify-content-end');
  });

  it('forwards custom classes and filter state callbacks to the menu', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const initialFilters = { currentPage: 4 } as PatternApprovalDashboardDto;
    const setInitialFilters =
      vi.fn<
        Dispatch<SetStateAction<PatternApprovalDashboardDto | undefined>>
      >();
    const setCurrentPage = vi.fn<Dispatch<SetStateAction<number>>>();

    render(
      <PaSearchFilter
        containerClassName='outer-filter'
        className='inner-filter'
        initialFilters={initialFilters}
        setInitialFilters={setInitialFilters}
        setCurrentPage={setCurrentPage}
      />,
    );

    const menu = screen.getByRole('button', { name: 'Filter applications' });

    expect(menu.closest('.container')).toHaveClass('outer-filter');
    expect(menu.closest('.row')).toHaveClass('inner-filter');

    await user.click(menu);

    expect(setCurrentPage).toHaveBeenCalledWith(1);
    expect(setInitialFilters).toHaveBeenCalledWith(initialFilters);
  });
});
