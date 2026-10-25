import { act, render, screen, within } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe(CustomPagination, () => {
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
    expect.assertions(2);
    render(
      <CustomPagination
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    );

    const nav = screen.getByRole('navigation', { hidden: true });

    expect(nav).toHaveAttribute('hidden');
    expect(within(nav).getByText('Page 1 of 1')).toBeInTheDocument();
  });
});
