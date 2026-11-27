import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import RhfForm from '@/components/forms/RhfForm';
import RhfNextStepButton from '@/components/forms/WizardForm/RhfNextStepButton';
import type { ModalProps } from '@/components/forms/types';
import * as Yup from 'yup';
import PreviousStepButton from '@/components/forms/WizardForm/PreviousStepButton';
import WizardStep from '@/components/forms/WizardForm/WizardStep';
import type GoogleAnalytics from '@/analytics/GoogleAnalyticsTracker';
import type ErrorBoundary from '@/components/ErrorBoundary';
import type { ComponentProps } from 'react';

interface WizardValues {
  name: string;
}
type Submit = (values: WizardValues) => undefined | Promise<unknown>;
type AnalyticsProps = ComponentProps<typeof GoogleAnalytics>;
type ErrorBoundaryProps = ComponentProps<typeof ErrorBoundary>;
type ErrorBoundaryMock = (
  props: ErrorBoundaryProps,
  context?: Record<string, never>,
) => React.ReactElement;

const wrapperMocks = vi.hoisted(() => ({
  analytics: vi.fn<(props: AnalyticsProps) => React.ReactElement>(
    ({ children }) => <>{children}</>,
  ),
  errorBoundary: vi.fn<ErrorBoundaryMock>(({ children }) => <>{children}</>),
}));

vi.mock(
  import('@/components/ErrorBoundary'),
  (() =>
    ({
      default: wrapperMocks.errorBoundary,
    }) satisfies __ExactMockModule<__TestMockModule13>) as unknown as __DynamicPartialMockFactory<__TestMockModule13>,
);

vi.mock(
  import('@/analytics/GoogleAnalyticsTracker'),
  (() =>
    ({
      default: wrapperMocks.analytics,
    }) satisfies __ExactMockModule<__TestMockModule160>) as unknown as __DynamicPartialMockFactory<__TestMockModule160>,
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

const required = Yup.object({ name: Yup.string().required('Required') });

const renderNext = ({
  initialValues = { name: 'Ready' },
  confirmation,
  finalStep = true,
  title,
  validateHard,
}: {
  initialValues?: WizardValues;
  confirmation?: ModalProps;
  finalStep?: boolean;
  title?: string;
  validateHard?: Yup.ObjectSchema<{ name: string }>;
} = {}) => {
  const onSubmit = vi.fn<Submit>();

  render(
    <RhfForm<WizardValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      {...(validateHard === undefined ? {} : { validateHard })}
    >
      {({ onFormSubmit }) => (
        <form onSubmit={onFormSubmit} noValidate>
          <RhfNextStepButton
            finalStep={finalStep}
            {...(title === undefined ? {} : { title })}
            {...(confirmation === undefined ? {} : { confirmation })}
          />
        </form>
      )}
    </RhfForm>,
  );

  return { onSubmit };
};

describe('wizard control behavior', () => {
  it('validates before opening final confirmation, closes it, then submits on confirmation', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const { onSubmit } = renderNext({
      title: 'Finish',
      validateHard: required,
      confirmation: {
        modalTitle: 'Confirm submission',
        modalBodyText: 'Submit now?',
      },
    });

    await user.click(screen.getByRole('button', { name: 'Finish' }));

    await expect(
      screen.findByRole('dialog', { name: 'Confirm submission' }),
    ).resolves.toBeInTheDocument();

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
    await user.click(
      await screen.findByRole('button', { name: 'Confirm yes' }),
    );
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit.mock.calls[0]?.[0]).toStrictEqual({ name: 'Ready' });
  });

  it('skips the confirmation and does not submit when final-step validation fails', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const { onSubmit } = renderNext({
      initialValues: { name: '' },
      validateHard: required,
      confirmation: { titleText: 'Confirm' },
    });

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('uses an empty confirmation title when no title variant is supplied', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderNext({ confirmation: {} });

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await expect(screen.findByRole('dialog')).resolves.toHaveAttribute(
      'aria-label',
      '',
    );
  });

  it.each([
    ['the final step', true, 'Submit'],
    ['a middle step', false, 'Save and next'],
  ])('labels the button for %s by default', (_name, finalStep, label) => {
    expect.hasAssertions();

    renderNext({ finalStep });

    expect(screen.getByTestId('save-and-next-button')).toHaveTextContent(label);
    expect(screen.getByTestId('save-and-next-button')).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('submits through the form without a confirmation', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const { onSubmit } = renderNext({ title: 'Go on' });

    await user.click(screen.getByRole('button', { name: 'Go on' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
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
    expect(wrapperMocks.errorBoundary).toHaveBeenCalledTimes(1);
    expect(wrapperMocks.errorBoundary.mock.calls[0]?.[0]).toHaveProperty(
      'children',
    );
    expect(wrapperMocks.errorBoundary.mock.calls[0]?.[1]).toStrictEqual({});
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
