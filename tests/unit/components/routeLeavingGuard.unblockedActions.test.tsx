import { fireEvent, render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import RouteLeavingGuard from '@/components/RouteLeavingGuard';

const resetBlocker = vi.fn();
const proceedBlocker = vi.fn();

vi.mock('react-router', () => ({
    useBlocker: () => ({
        state: 'unblocked',
        reset: resetBlocker,
        proceed: proceedBlocker,
    }),
}));

vi.mock('react-bootstrap/Modal', () => {
    const Modal = ({ children, onHide }: { children: React.ReactNode; onHide: () => void }) => (
        <div>
            <button type='button' onClick={onHide}>Hide modal</button>
            {children}
        </div>
    );
    Modal.Header = function ModalHeader({ children }: { children: React.ReactNode }) {
        return <div>{children}</div>;
    };
    Modal.Title = function ModalTitle({ children }: { children: React.ReactNode }) {
        return <h3>{children}</h3>;
    };
    Modal.Body = function ModalBody({ children }: { children: React.ReactNode }) {
        return <div>{children}</div>;
    };
    Modal.Footer = function ModalFooter({ children }: { children: React.ReactNode }) {
        return <div>{children}</div>;
    };
    return { default: Modal };
});

describe('RouteLeavingGuard unblocked actions', () => {
    it('ignores close and confirm actions when navigation is not blocked', () => {
        render(
            <Formik initialValues={{}} onSubmit={vi.fn()}>
                <RouteLeavingGuard />
            </Formik>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Hide modal' }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

        expect(resetBlocker).not.toHaveBeenCalled();
        expect(proceedBlocker).not.toHaveBeenCalled();
    });
});
