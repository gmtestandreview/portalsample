import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RouteLeavingGuard from '../../../ClientApp/src/components/RouteLeavingGuard';
import { defined } from '../helpers/defined';

const resetBlocker = vi.fn();
const proceedBlocker = vi.fn();
const useBlockerMock = vi.fn();

vi.mock('react-router', () => ({
  useBlocker: (callback: unknown) => useBlockerMock(callback),
}));

const renderGuard = (
  props: React.ComponentProps<typeof RouteLeavingGuard> = {}
) => render(<RouteLeavingGuard {...props} />);

describe(RouteLeavingGuard, () => {
  beforeEach(() => {
    resetBlocker.mockReset();
    proceedBlocker.mockReset();
    useBlockerMock.mockReset();
  });

  it('keeps the modal hidden while navigation is unblocked', () => {
    useBlockerMock.mockReturnValue({
      state: 'unblocked',
      reset: resetBlocker,
      proceed: proceedBlocker,
    });

    renderGuard();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useBlockerMock).toHaveBeenCalledWith(expect.any(Function));
  });

  it('blocks navigation only when enabled and the pathname changes', () => {
    useBlockerMock.mockReturnValue({
      state: 'unblocked',
      reset: resetBlocker,
      proceed: proceedBlocker,
    });

    renderGuard({ when: true });

    const blockerPredicate = defined(
      useBlockerMock.mock.calls[0],
      'enabled blocker call'
    )[0] as (args: {
      currentLocation: { pathname: string };
      nextLocation: { pathname: string };
    }) => boolean;

    expect(
      blockerPredicate({
        currentLocation: { pathname: '/quote' },
        nextLocation: { pathname: '/quote' },
      })
    ).toBe(false);
    expect(
      blockerPredicate({
        currentLocation: { pathname: '/quote' },
        nextLocation: { pathname: '/dashboard' },
      })
    ).toBe(true);

    useBlockerMock.mockClear();
    renderGuard({ when: false });
    const disabledPredicate = defined(
      useBlockerMock.mock.calls[0],
      'disabled blocker call'
    )[0] as typeof blockerPredicate;

    expect(
      disabledPredicate({
        currentLocation: { pathname: '/quote' },
        nextLocation: { pathname: '/dashboard' },
      })
    ).toBe(false);
  });

  it('allows custom copy and resets a blocked navigation on cancel', async () => {
    const user = userEvent.setup();
    useBlockerMock.mockReturnValue({
      state: 'blocked',
      reset: resetBlocker,
      proceed: proceedBlocker,
    });

    renderGuard({
      when: true,
      title: 'Leave form?',
      body: 'Your edits are not saved.',
      cancelBtn: 'Stay here',
      confirmBtn: 'Leave page',
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Leave form?' })
    ).toBeInTheDocument();
    expect(screen.getByText('Your edits are not saved.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /stay here/i }));

    expect(resetBlocker).toHaveBeenCalledTimes(1);
    expect(proceedBlocker).not.toHaveBeenCalled();
  });

  it('runs onProceed and then proceeds when a blocked navigation is confirmed', async () => {
    const user = userEvent.setup();
    const onProceed = vi.fn(() => {
      expect(proceedBlocker).not.toHaveBeenCalled();
    });
    useBlockerMock.mockReturnValue({
      state: 'blocked',
      reset: resetBlocker,
      proceed: proceedBlocker,
    });

    renderGuard({ when: true, onProceed });

    await user.click(screen.getByRole('button', { name: /discard changes/i }));

    expect(onProceed).toHaveBeenCalledTimes(1);
    expect(proceedBlocker).toHaveBeenCalledTimes(1);
    expect(resetBlocker).not.toHaveBeenCalled();
  });

  it('proceeds without an onProceed callback and does not run it on cancel', async () => {
    const user = userEvent.setup();
    const onProceed = vi.fn();
    useBlockerMock.mockReturnValue({
      state: 'blocked',
      reset: resetBlocker,
      proceed: proceedBlocker,
    });

    const { unmount } = renderGuard({ when: true });
    await user.click(screen.getByRole('button', { name: /discard changes/i }));

    expect(proceedBlocker).toHaveBeenCalledTimes(1);

    unmount();

    renderGuard({ when: true, onProceed });
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onProceed).not.toHaveBeenCalled();
  });
});
