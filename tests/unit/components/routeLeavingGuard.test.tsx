import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import '@testing-library/jest-dom/vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import RouteLeavingGuard from '../../../ClientApp/src/components/RouteLeavingGuard';

import { defined } from '../helpers/defined';

const resetBlocker = vi.fn();

const proceedBlocker = vi.fn();

const useBlockerMock = vi.fn();

vi.mock(
  import('react-router'),
  () =>
    ({
      useBlocker: (callback: unknown) => useBlockerMock(callback),
    }) satisfies __ExactMockModule<__TestMockModule11>,
);

const renderGuard = (
  props: React.ComponentProps<typeof RouteLeavingGuard> = {},
) => render(<RouteLeavingGuard {...props} />);

describe(RouteLeavingGuard, () => {
  beforeEach(() => {
    resetBlocker.mockReset();
    proceedBlocker.mockReset();
    useBlockerMock.mockReset();
  });
  it('keeps the modal hidden while navigation is unblocked', () => {
    expect.assertions(2);
    useBlockerMock.mockReturnValue({
      state: 'unblocked',
      reset: resetBlocker,
      proceed: proceedBlocker,
    });

    renderGuard();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useBlockerMock).toHaveBeenCalledWith(expect.any(Function));
  });
});

describe(RouteLeavingGuard, () => {
  beforeEach(() => {
    resetBlocker.mockReset();
    proceedBlocker.mockReset();
    useBlockerMock.mockReset();
  });
  it('blocks navigation only when enabled and the pathname changes', () => {
    expect.assertions(3);
    useBlockerMock.mockReturnValue({
      state: 'unblocked',
      reset: resetBlocker,
      proceed: proceedBlocker,
    });

    renderGuard({ when: true });

    const blockerPredicate = defined(
      useBlockerMock.mock.calls[0],
      'enabled blocker call',
    )[0] as (args: {
      currentLocation: { pathname: string };
      nextLocation: { pathname: string };
    }) => boolean;

    expect(
      blockerPredicate({
        currentLocation: { pathname: '/quote' },
        nextLocation: { pathname: '/quote' },
      }),
    ).toBe(false);
    expect(
      blockerPredicate({
        currentLocation: { pathname: '/quote' },
        nextLocation: { pathname: '/dashboard' },
      }),
    ).toBe(true);

    useBlockerMock.mockClear();
    renderGuard({ when: false });
    const disabledPredicate = defined(
      useBlockerMock.mock.calls[0],
      'disabled blocker call',
    )[0] as typeof blockerPredicate;

    expect(
      disabledPredicate({
        currentLocation: { pathname: '/quote' },
        nextLocation: { pathname: '/dashboard' },
      }),
    ).toBe(false);
  });
});
