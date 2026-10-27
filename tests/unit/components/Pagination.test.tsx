import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CustomPagination from '@/components/Pagination';

const originalInnerWidth = Object.getOwnPropertyDescriptor(
  globalThis,
  'innerWidth',
);

const setViewportWidth = (width: number) => {
  Object.defineProperty(globalThis, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
};

describe('custom pagination', () => {
  const resetPaginationState = () => {
    vi.useRealTimers();
    if (originalInnerWidth) {
      Object.defineProperty(globalThis, 'innerWidth', originalInnerWidth);
    }
  };

  it('hides the navigation when there is only one page', () => {
    expect.hasAssertions();

    resetPaginationState();
    setViewportWidth(1200);

    render(
      <CustomPagination
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn<() => void>()}
      />,
    );

    const nav = screen.getByRole('navigation', { hidden: true });

    expect(nav).toHaveAttribute('hidden');
    expect(within(nav).getByText('Page 1 of 1')).toBeInTheDocument();
  });

  it('calls page change callbacks for numbered, previous, next, first, and last controls', async () => {
    expect.hasAssertions();

    resetPaginationState();
    setViewportWidth(1200);

    const user = userEvent.setup();
    const onPageChange = vi.fn<(page: number) => void>();

    render(
      <CustomPagination
        currentPage={6}
        totalPages={20}
        onPageChange={onPageChange}
      />,
    );

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
    expect.hasAssertions();

    resetPaginationState();
    setViewportWidth(1200);

    const user = userEvent.setup();
    const onPageChange = vi.fn<(page: number) => void>();

    const firstPage = render(
      <CustomPagination
        currentPage={1}
        totalPages={3}
        onPageChange={onPageChange}
      />,
    );
    await user.click(screen.getByTitle('Go back a page'));
    firstPage.unmount();

    render(
      <CustomPagination
        currentPage={3}
        totalPages={3}
        onPageChange={onPageChange}
      />,
    );
    await user.click(screen.getByTitle('Go forward a page'));

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('keeps the visible page range anchored near the start and end', () => {
    expect.hasAssertions();

    resetPaginationState();
    setViewportWidth(1200);

    const { rerender } = render(
      <CustomPagination
        currentPage={2}
        totalPages={20}
        onPageChange={vi.fn<() => void>()}
      />,
    );

    expect({
      page1: screen.queryByLabelText('Page 1') !== null,
      page10: screen.queryByLabelText('Page 10') !== null,
      page11: screen.queryByLabelText('Page 11') !== null,
    }).toStrictEqual({ page1: true, page10: true, page11: false });

    rerender(
      <CustomPagination
        currentPage={19}
        totalPages={20}
        onPageChange={vi.fn<() => void>()}
      />,
    );

    expect({
      page10: screen.queryByLabelText('Page 10') !== null,
      page11: screen.queryByLabelText('Page 11') !== null,
      page20: screen.queryByLabelText('Page 20') !== null,
    }).toStrictEqual({ page10: false, page11: true, page20: true });
  });

  it('updates the visible page range after a debounced responsive resize', () => {
    expect.hasAssertions();

    resetPaginationState();

    vi.useFakeTimers();
    setViewportWidth(1200);

    render(
      <CustomPagination
        currentPage={6}
        totalPages={20}
        onPageChange={vi.fn<() => void>()}
      />,
    );

    expect({
      page1: screen.queryByLabelText('Page 1') !== null,
      page11: screen.queryByLabelText('Page 11') !== null,
    }).toStrictEqual({ page1: true, page11: true });

    setViewportWidth(500);
    act(() => {
      globalThis.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(499);
    });

    expect(screen.getByLabelText('Page 1')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect({
      page1: screen.queryByLabelText('Page 1') !== null,
      page5: screen.queryByLabelText('Page 5') !== null,
      page6: screen.queryByLabelText('Page 6') !== null,
      page7: screen.queryByLabelText('Page 7') !== null,
    }).toStrictEqual({ page1: false, page5: true, page6: true, page7: true });
  });

  it.each([
    [800, ['Page 3', 'Page 9'], ['Page 2', 'Page 10']],
    [600, ['Page 4', 'Page 8'], ['Page 3', 'Page 9']],
  ])(
    'uses the matching initial page range for a %i px viewport',
    (width, visibleLabels, hiddenLabels) => {
      expect.hasAssertions();

      resetPaginationState();

      setViewportWidth(width);

      render(
        <CustomPagination
          currentPage={6}
          totalPages={20}
          onPageChange={vi.fn<() => void>()}
        />,
      );

      visibleLabels.forEach((label) => {
        expect(screen.getByLabelText(label)).toBeInTheDocument();
      });
      hiddenLabels.forEach((label) => {
        expect(screen.queryByLabelText(label)).not.toBeInTheDocument();
      });
    },
  );
});
