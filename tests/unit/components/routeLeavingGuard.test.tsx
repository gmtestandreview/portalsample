import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { Formik, useFormikContext } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RouteLeavingGuard from '../../../ClientApp/src/components/RouteLeavingGuard';

const resetBlocker = vi.fn();
const proceedBlocker = vi.fn();
const useBlockerMock = vi.fn();

vi.mock('react-router', () => ({
    useBlocker: (callback: unknown) => useBlockerMock(callback),
}));

function ErrorsProbe() {
    const { errors } = useFormikContext();
    return <pre data-testid='formik-errors'>{JSON.stringify(errors)}</pre>;
}

const renderGuard = (
    props: React.ComponentProps<typeof RouteLeavingGuard> = {},
    initialErrors: Record<string, string> = {},
) => render(
    <Formik initialValues={{ name: 'NMI' }} initialErrors={initialErrors} onSubmit={vi.fn()}>
        <>
            <RouteLeavingGuard {...props} />
            <ErrorsProbe />
        </>
    </Formik>,
);

describe('RouteLeavingGuard', () => {
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

        const blockerPredicate = useBlockerMock.mock.calls[0][0] as (args: {
            currentLocation: { pathname: string };
            nextLocation: { pathname: string };
        }) => boolean;

        expect(blockerPredicate({
            currentLocation: { pathname: '/quote' },
            nextLocation: { pathname: '/quote' },
        })).toBe(false);
        expect(blockerPredicate({
            currentLocation: { pathname: '/quote' },
            nextLocation: { pathname: '/dashboard' },
        })).toBe(true);

        useBlockerMock.mockClear();
        renderGuard({ when: false });
        const disabledPredicate = useBlockerMock.mock.calls[0][0] as typeof blockerPredicate;

        expect(disabledPredicate({
            currentLocation: { pathname: '/quote' },
            nextLocation: { pathname: '/dashboard' },
        })).toBe(false);
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
        expect(screen.getByRole('heading', { name: 'Leave form?' })).toBeInTheDocument();
        expect(screen.getByText('Your edits are not saved.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /stay here/i }));

        expect(resetBlocker).toHaveBeenCalledTimes(1);
        expect(proceedBlocker).not.toHaveBeenCalled();
    });

    it('clears Formik errors and proceeds when a blocked navigation is confirmed', async () => {
        const user = userEvent.setup();
        useBlockerMock.mockReturnValue({
            state: 'blocked',
            reset: resetBlocker,
            proceed: proceedBlocker,
        });

        renderGuard({ when: true }, { name: 'Required' });

        expect(screen.getByTestId('formik-errors')).toHaveTextContent('"name":"Required"');

        await user.click(screen.getByRole('button', { name: /discard changes/i }));

        expect(proceedBlocker).toHaveBeenCalledTimes(1);
        expect(resetBlocker).not.toHaveBeenCalled();
        expect(screen.getByTestId('formik-errors')).toHaveTextContent('{}');
    });
});
