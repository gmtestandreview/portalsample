import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import RouteLeavingGuard from '@/components/RouteLeavingGuard';

const resetBlocker = vi.fn<() => void>();
const proceedBlocker = vi.fn<() => void>();

vi.mock(
  import('react-router'),
  (() =>
    ({
      useBlocker: () => ({
        state: 'unblocked',
        reset: resetBlocker,
        proceed: proceedBlocker,
      }),
    }) satisfies __ExactMockModule<__TestMockModule11>) as unknown as __DynamicPartialMockFactory<__TestMockModule11>,
);

vi.mock(import('react-bootstrap/Modal'), (() => {
  const Modal = ({
    children,
    onHide,
  }: {
    children: React.ReactNode;
    onHide: () => void;
  }) => (
    <div>
      <button type='button' onClick={onHide}>
        Hide modal
      </button>
      {children}
    </div>
  );
  Modal.Header = function ModalHeader({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div>{children}</div>;
  };
  Modal.Title = function ModalTitle({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <h3>{children}</h3>;
  };
  Modal.Body = function ModalBody({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
  Modal.Footer = function ModalFooter({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div>{children}</div>;
  };
  return { default: Modal } satisfies __ExactMockModule<__TestMockModule51>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule51>);

describe('routeLeavingGuard unblocked actions', () => {
  it('ignores close and confirm actions when navigation is not blocked', () => {
    expect.hasAssertions();

    render(
      <Formik initialValues={{}} onSubmit={vi.fn<() => void>()}>
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
