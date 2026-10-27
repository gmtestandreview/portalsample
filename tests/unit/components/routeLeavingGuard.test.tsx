import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import {
  NavigationType,
  type Blocker,
  type BlockerFunction,
} from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import RouteLeavingGuard from '../../../ClientApp/src/components/RouteLeavingGuard';
import { defined } from '../helpers/defined';

const resetBlocker = vi.fn<() => void>();
const proceedBlocker = vi.fn<() => void>();
type UseBlocker = (shouldBlock: boolean | BlockerFunction) => Blocker;

const useBlockerMock = vi.hoisted(() => vi.fn<UseBlocker>());

const unblockedBlocker: Blocker = {
  state: 'unblocked',
  reset: undefined,
  proceed: undefined,
  location: undefined,
};

const blockedBlocker: Blocker = {
  state: 'blocked',
  reset: resetBlocker,
  proceed: proceedBlocker,
  location: {
    pathname: '/dashboard',
    search: '',
    hash: '',
    state: null,
    key: 'blocked-location',
  },
};

const locationFor = (pathname: string) => ({
  pathname,
  search: '',
  hash: '',
  state: null,
  key: pathname,
});

const transitionFor = (
  currentPathname: string,
  nextPathname: string,
): Parameters<BlockerFunction>[0] => ({
  currentLocation: locationFor(currentPathname),
  nextLocation: locationFor(nextPathname),
  historyAction: NavigationType.Push,
});

const getBlockerPredicate = (): BlockerFunction => {
  const predicate = defined(useBlockerMock.mock.calls[0], 'blocker call')[0];
  if (typeof predicate !== 'function') {
    throw new Error('Expected useBlocker to receive a predicate');
  }
  return predicate;
};

vi.mock(import('react-router'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useBlocker: useBlockerMock,
  } satisfies __ExactMockModule<__TestMockModule11>;
});

const renderGuard = (
  props: React.ComponentProps<typeof RouteLeavingGuard> = {},
) => render(<RouteLeavingGuard {...props} />);

describe('route leaving guard', () => {
  const resetRouteLeavingGuardMocks = () => {
    resetBlocker.mockReset();
    proceedBlocker.mockReset();
    useBlockerMock.mockReset();
  };

  it('keeps the modal hidden while navigation is unblocked', () => {
    expect.hasAssertions();

    resetRouteLeavingGuardMocks();

    useBlockerMock.mockReturnValue(unblockedBlocker);

    renderGuard();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useBlockerMock).toHaveBeenCalledWith(expect.any(Function));
  });

  it('blocks navigation only when enabled and the pathname changes', () => {
    expect.hasAssertions();

    resetRouteLeavingGuardMocks();

    useBlockerMock.mockReturnValue(unblockedBlocker);

    renderGuard({ when: true });

    const blockerPredicate = getBlockerPredicate();

    expect(blockerPredicate(transitionFor('/quote', '/quote'))).toBe(false);
    expect(blockerPredicate(transitionFor('/quote', '/dashboard'))).toBe(true);

    useBlockerMock.mockClear();
    renderGuard({ when: false });
    const disabledPredicate = getBlockerPredicate();

    expect(disabledPredicate(transitionFor('/quote', '/dashboard'))).toBe(
      false,
    );
  });

  it('allows custom copy and resets a blocked navigation on cancel', async () => {
    expect.hasAssertions();

    resetRouteLeavingGuardMocks();

    const user = userEvent.setup();
    useBlockerMock.mockReturnValue(blockedBlocker);

    renderGuard({
      when: true,
      title: 'Leave form?',
      body: 'Your edits are not saved.',
      cancelBtn: 'Stay here',
      confirmBtn: 'Leave page',
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Leave form?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Your edits are not saved.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /stay here/i }));

    expect(resetBlocker).toHaveBeenCalledTimes(1);
    expect(proceedBlocker).not.toHaveBeenCalled();
  });

  it('runs onProceed and then proceeds when a blocked navigation is confirmed', async () => {
    expect.hasAssertions();

    resetRouteLeavingGuardMocks();

    const user = userEvent.setup();
    const onProceed = vi.fn<() => void>(() => {
      expect(proceedBlocker).not.toHaveBeenCalled();
    });
    useBlockerMock.mockReturnValue(blockedBlocker);

    renderGuard({ when: true, onProceed });

    await user.click(screen.getByRole('button', { name: /discard changes/i }));

    expect(onProceed).toHaveBeenCalledTimes(1);
    expect(proceedBlocker).toHaveBeenCalledTimes(1);
    expect(resetBlocker).not.toHaveBeenCalled();
  });

  it('proceeds without an onProceed callback and does not run it on cancel', async () => {
    expect.hasAssertions();

    resetRouteLeavingGuardMocks();

    const user = userEvent.setup();
    const onProceed = vi.fn<() => void>();
    useBlockerMock.mockReturnValue(blockedBlocker);

    const { unmount } = renderGuard({ when: true });
    await user.click(screen.getByRole('button', { name: /discard changes/i }));

    expect(proceedBlocker).toHaveBeenCalledTimes(1);

    unmount();

    renderGuard({ when: true, onProceed });
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onProceed).not.toHaveBeenCalled();
  });
});
