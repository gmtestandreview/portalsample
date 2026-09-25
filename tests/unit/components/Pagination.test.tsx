import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CustomPagination from '@/components/Pagination';

const originalInnerWidth = Object.getOwnPropertyDescriptor(globalThis, 'innerWidth');

const setViewportWidth = (width: number) => {
    Object.defineProperty(globalThis, 'innerWidth', {
        configurable: true,
        writable: true,
        value: width,
    });
};

describe('CustomPagination', () => {
    beforeEach(() => {
        setViewportWidth(1200);
    });

    afterEach(() => {
        vi.useRealTimers();
        if (originalInnerWidth) {
            Object.defineProperty(globalThis, 'innerWidth', originalInnerWidth);
        }
    });

    it('hides the navigation when there is only one page', () => {
        render(<CustomPagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />);

        const nav = screen.getByRole('navigation', { hidden: true });

        expect(nav).toHaveAttribute('hidden');
        expect(within(nav).getByText('Page 1 of 1')).toBeInTheDocument();
    });

    it('calls page change callbacks for numbered, previous, next, first, and last controls', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();

        render(<CustomPagination currentPage={6} totalPages={20} onPageChange={onPageChange} />);

        await user.click(screen.getByLabelText('Page 7'));
        await user.click(screen.getByTitle('Go back a page'));
        await user.click(screen.getByTitle('Go forward a page'));
        await user.click(screen.getByTitle('Go to first page'));
        await user.click(screen.getByTitle('Go to last page'));

        expect(onPageChange).toHaveBeenNthCalledWith(1, 7);
        expect(onPageChange).toHaveBeenNthCalledWith(2, 5);
        expect(onPageChange).toHaveBeenNthCalledWith(3, 7);
        expect(onPageChange).toHaveBeenNthCalledWith(4, 1);
        expect(onPageChange).toHaveBeenNthCalledWith(5, 20);
    });

    it('does not call page change for previous or next controls outside page bounds', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();

        const firstPage = render(
            <CustomPagination currentPage={1} totalPages={3} onPageChange={onPageChange} />,
        );
        await user.click(screen.getByTitle('Go back a page'));
        firstPage.unmount();

        render(<CustomPagination currentPage={3} totalPages={3} onPageChange={onPageChange} />);
        await user.click(screen.getByTitle('Go forward a page'));

        expect(onPageChange).not.toHaveBeenCalled();
    });

    it('keeps the visible page range anchored near the start and end', () => {
        const { rerender } = render(
            <CustomPagination currentPage={2} totalPages={20} onPageChange={vi.fn()} />,
        );

        expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Page 10')).toBeInTheDocument();
        expect(screen.queryByLabelText('Page 11')).not.toBeInTheDocument();

        rerender(<CustomPagination currentPage={19} totalPages={20} onPageChange={vi.fn()} />);

        expect(screen.queryByLabelText('Page 10')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Page 11')).toBeInTheDocument();
        expect(screen.getByLabelText('Page 20')).toBeInTheDocument();
    });

    it('updates the visible page range after a debounced responsive resize', () => {
        vi.useFakeTimers();
        setViewportWidth(1200);

        render(<CustomPagination currentPage={6} totalPages={20} onPageChange={vi.fn()} />);

        expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Page 11')).toBeInTheDocument();

        setViewportWidth(500);
        act(() => {
            globalThis.dispatchEvent(new Event('resize'));
            vi.advanceTimersByTime(499);
        });

        expect(screen.getByLabelText('Page 1')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(1);
        });

        expect(screen.queryByLabelText('Page 1')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Page 5')).toBeInTheDocument();
        expect(screen.getByLabelText('Page 6')).toBeInTheDocument();
        expect(screen.getByLabelText('Page 7')).toBeInTheDocument();
    });

    it.each([
        [800, ['Page 3', 'Page 9'], ['Page 2', 'Page 10']],
        [600, ['Page 4', 'Page 8'], ['Page 3', 'Page 9']],
    ])('uses the matching initial page range for a %i px viewport', (width, visibleLabels, hiddenLabels) => {
        setViewportWidth(width);

        render(<CustomPagination currentPage={6} totalPages={20} onPageChange={vi.fn()} />);

        visibleLabels.forEach((label) => {
            expect(screen.getByLabelText(label)).toBeInTheDocument();
        });
        hiddenLabels.forEach((label) => {
            expect(screen.queryByLabelText(label)).not.toBeInTheDocument();
        });
    });
});
