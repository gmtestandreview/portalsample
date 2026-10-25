import { describe, it, expect } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Form, Formik } from 'formik';

import { MemoryRouter } from 'react-router';

import NextStepButton from '@/components/forms/WizardForm/NextStepButton';

import PreviousStepButton from '@/components/forms/WizardForm/PreviousStepButton';

import WizardForm from '@/components/forms/WizardForm';

import WizardStep from '@/components/forms/WizardForm/WizardStep';

const wrapperMocks = vi.hoisted(() => ({
  analytics: vi.fn(({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  )),
  errorBoundary: vi.fn(({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  )),
}));

vi.mock(
  import('@/components/ErrorBoundary'),
  () =>
    ({
      default: wrapperMocks.errorBoundary,
    }) satisfies __ExactMockModule<__TestMockModule13>,
);

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({
      default: wrapperMocks.analytics,
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  import('@/components/modals/ConfirmationModal'),
  () =>
    ({
      default: ({
        closeModal,
        isOpen,
        onModalNo,
        onModalYes,
        titleText,
      }: {
        closeModal: () => void;
        isOpen: boolean;
        onModalNo: () => void;
        onModalYes: () => void;
        titleText: string;
      }) =>
        isOpen ? (
          <dialog open aria-label={titleText}>
            <button type='button' onClick={onModalYes}>
              Confirm yes
            </button>
            <button type='button' onClick={onModalNo}>
              Confirm no
            </button>
            <button type='button' onClick={closeModal}>
              Close confirmation
            </button>
          </dialog>
        ) : null,
    }) satisfies __ExactMockModule<__TestMockModule23>,
);

const step = (location: string) => (
  <WizardStep
    title={location}
    location={location}
    initialValues={{}}
    stepStatuses={[]}
    loadStepValues={() => ({ stepValues: {} })}
  />
);

describe('wizard control behavior', () => {
  it('validates before opening final confirmation, closes it, then submits on confirmation', async () => {
    expect.assertions(4);
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Formik
        initialValues={{ name: 'Ready' }}
        onSubmit={onSubmit}
        validate={() => ({})}
      >
        <Form>
          <NextStepButton
            steps={[step('/final')]}
            currentStepIndex={0}
            finalStepTitle='Finish'
            finalStepConfirmation={{
              modalTitle: 'Confirm submission',
              modalBodyText: 'Submit now?',
            }}
          />
        </Form>
      </Formik>,
    );

    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(
      screen.getByRole('dialog', { name: 'Confirm submission' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm no' }));

    expect(
      screen.getByRole('dialog', { name: 'Confirm submission' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Close confirmation' }),
    );

    expect(
      screen.queryByRole('dialog', { name: 'Confirm submission' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Finish' }));
    await user.click(screen.getByRole('button', { name: 'Confirm yes' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});
