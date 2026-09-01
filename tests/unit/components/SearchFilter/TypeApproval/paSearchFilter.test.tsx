import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PatternApprovalDashboardDto } from '@/api/web-api-client';
import PaSearchFilter from '@/components/SearchFilter/TypeApproval/paSearchFilter';

vi.mock('@/components/SearchFilter/TypeApproval/paFilterMenu', () => ({
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
}));

describe('PaSearchFilter', () => {
    it('renders the filter menu with default Bootstrap layout classes', () => {
        const initialFilters = { currentPage: 3 } as PatternApprovalDashboardDto;

        render(
            <PaSearchFilter
                initialFilters={initialFilters}
                setInitialFilters={vi.fn()}
                setCurrentPage={vi.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'Filter applications' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Filter applications' }).closest('.container')).toHaveClass('container');
        expect(screen.getByRole('button', { name: 'Filter applications' }).closest('.row')).toHaveClass('row');
        expect(screen.getByRole('button', { name: 'Filter applications' }).closest('.col')).toHaveClass('d-flex', 'justify-content-end');
    });

    it('forwards custom classes and filter state callbacks to the menu', async () => {
        const user = userEvent.setup();
        const initialFilters = { currentPage: 4 } as PatternApprovalDashboardDto;
        const setInitialFilters = vi.fn();
        const setCurrentPage = vi.fn();

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
