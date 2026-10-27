import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import type { FormikConfig } from 'formik';
import { MemoryRouter } from 'react-router';
import NextStepButton from '@/components/forms/WizardForm/NextStepButton';
import PreviousStepButton from '@/components/forms/WizardForm/PreviousStepButton';
import WizardForm from '@/components/forms/WizardForm';
import WizardStep from '@/components/forms/WizardForm/WizardStep';
import type GoogleAnalytics from '@/analytics/GoogleAnalytics';
import type ErrorBoundary from '@/components/ErrorBoundary';
import type { ComponentProps } from 'react';

type WizardValues = { name: string };
type Submit = NonNullable<FormikConfig<WizardValues>['onSubmit']>;
type Validate = NonNullable<FormikConfig<WizardValues>['validate']>;
type AnalyticsProps = ComponentProps<typeof GoogleAnalytics>;
type ErrorBoundaryProps = ComponentProps<typeof ErrorBoundary>;

const wrapperMocks = vi.hoisted(() => ({
  analytics: vi.fn<(props: AnalyticsProps) => React.ReactElement>(
    ({ children }) => <>{children}</>,
  ),
  errorBoundary: vi.fn<(props: ErrorBoundaryProps) => React.ReactElement>(
    ({ children }) => <>{children}</>,
  ),
}));

vi.mock(
  import('@/components/ErrorBoundary'),
  (() =>
    ({
      default: wrapperMocks.errorBoundary,
    }) satisfies __ExactMockModule<__TestMockModule13>) as unknown as __DynamicPartialMockFactory<__TestMockModule13>,
);

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  (() =>
    ({
      default: wrapperMocks.analytics,
    }) satisfies __ExactMockModule<__TestMockModule22>) as unknown as __DynamicPartialMockFactory<__TestMockModule22>,
);

vi.mock(
  import('@/components/modals/ConfirmationModal'),
  (() =>
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
    }) satisfies __ExactMockModule<__TestMockModule23>) as unknown as __DynamicPartialMockFactory<__TestMockModule23>,
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
    expect.hasAssertions();

    const user = userEvent.setup();
    const onSubmit = vi.fn<Submit>();
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

  it('submits directly when final-step validation already has errors', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const onSubmit = vi.fn<Submit>();
    render(
      <Formik
        initialErrors={{ name: 'Required' }}
        initialValues={{ name: '' }}
        onSubmit={onSubmit}
      >
        <Form>
          <NextStepButton
            steps={[step('/final')]}
            currentStepIndex={0}
            finalStepConfirmation={{ titleText: 'Confirm' }}
          />
        </Form>
      </Formik>,
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('runs submitForm when modal validation returns errors after a clean initial render', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const validate = vi.fn<Validate>().mockReturnValue({ name: 'Required' });
    render(
      <Formik
        initialValues={{ name: '' }}
        onSubmit={vi.fn<Submit>()}
        validate={validate}
      >
        <Form>
          <NextStepButton
            steps={[step('/final')]}
            currentStepIndex={0}
            finalStepConfirmation={{ titleText: 'Confirm' }}
          />
        </Form>
      </Formik>,
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(validate).toHaveBeenCalledWith({ name: '' }, undefined),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses an empty confirmation title when no title variant is supplied', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    render(
      <Formik
        initialValues={{}}
        onSubmit={vi.fn<
          NonNullable<FormikConfig<Record<string, never>>['onSubmit']>
        >()}
      >
        <Form>
          <NextStepButton
            steps={[step('/final')]}
            currentStepIndex={0}
            finalStepConfirmation={{}}
          />
        </Form>
      </Formik>,
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', '');
  });

  it('handles previous-step absence and custom links', () => {
    expect.hasAssertions();

    const steps = [step('/first'), step('/second')];
    const { rerender } = render(
      <MemoryRouter>
        <PreviousStepButton steps={steps} currentStepIndex={0} url='/wizard' />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <PreviousStepButton
          steps={steps}
          currentStepIndex={1}
          title='Previous details'
          url='/wizard'
          className='custom-back'
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('link', { name: 'Previous details' }),
    ).toHaveAttribute('href', '/wizard/first');
    expect(screen.getByRole('link', { name: 'Previous details' })).toHaveClass(
      'custom-back',
    );
  });

  it('rejects an invalid previous-step child without mounting React', () => {
    expect.hasAssertions();
    expect(() =>
      PreviousStepButton({
        steps: ['invalid' as unknown as React.ReactElement],
        currentStepIndex: 1,
        url: '/wizard',
      }),
    ).toThrow('WizardForm only accepts children of type WizardStep');
  });

  it('rejects invalid WizardForm children', () => {
    expect.hasAssertions();

    const preventError = (event: ErrorEvent) => event.preventDefault();
    globalThis.addEventListener('error', preventError);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      expect(() =>
        render(
          <MemoryRouter>
            <WizardForm locationOnCompletion='/complete'>
              {'invalid child' as unknown as React.ReactElement}
            </WizardForm>
          </MemoryRouter>,
        ),
      ).toThrow('WizardForm only accepts children of type WizardStep');
    } finally {
      consoleError.mockRestore();
      globalThis.removeEventListener('error', preventError);
    }
  });

  it('renders the real WizardStep through analytics and error-boundary wrappers', () => {
    expect.hasAssertions();

    render(
      <WizardStep
        title='Wrapped'
        location='/wrapped'
        initialValues={{}}
        stepStatuses={[]}
        loadStepValues={() => ({ stepValues: {} })}
      >
        <span>Wrapped step content</span>
      </WizardStep>,
    );

    expect(screen.getByText('Wrapped step content')).toBeInTheDocument();
    expect(wrapperMocks.errorBoundary).toHaveBeenCalledWith(
      expect.objectContaining({ children: expect.anything() }),
      {},
    );
    expect(wrapperMocks.analytics).toHaveBeenCalledWith(
      expect.objectContaining({
        anonymiseIp: false,
        sendPageView: true,
        testMode: false,
      }),
      {},
    );
  });
});
