import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

import type { PatternApprovalDashboardDto } from '@/api/web-api-client';

import PaSearchFilter from '@/components/SearchFilter/TypeApproval/paSearchFilter';

vi.mock(
  import('@/components/SearchFilter/TypeApproval/paFilterMenu'),
  () =>
    ({
      default: ({
        initialFilters,
        setCurrentPage,
        setInitialFilters,
      }: {
        initialFilters: PatternApprovalDashboardDto;
        setCurrentPage: (page: number) => void;
        setInitialFilters: (filters: PatternApprovalDashboardDto) => void;
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

describe(PaSearchFilter, () => {
  it('renders the filter menu with default Bootstrap layout classes', () => {
    expect.assertions(4);
    const initialFilters = { currentPage: 3 } as PatternApprovalDashboardDto;

    render(
      <PaSearchFilter
        initialFilters={initialFilters}
        setInitialFilters={vi.fn()}
        setCurrentPage={vi.fn()}
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
});
