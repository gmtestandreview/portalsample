import type { PropsWithChildren } from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as Yup from 'yup';
import { FormStepStatus } from '@/api/web-api-client';
import RhfTextInput from '@/components/Inputs/RhfTextInput';
import RhfHidableField from '@/components/forms/RhfHidableField';
import RhfWizardRoutedStep from '@/components/forms/WizardForm/RhfWizardRoutedStep';
import type { RhfWizardRoutedStepProps } from '@/components/forms/WizardForm/RhfWizardRoutedStep';
import type AppLogger from '@/instrumentation/AppLogger';
import { renderWithRouter } from '../../../helpers/renderWithRouter';

vi.mock(
  import('@/instrumentation/AppLogger'),
  (() =>
    ({
      default: {
        verbose: vi.fn<typeof AppLogger.verbose>(),
        error: vi.fn<typeof AppLogger.error>(),
        trace: vi.fn<typeof AppLogger.trace>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>) as unknown as __DynamicPartialMockFactory<__TestMockModule5>,
);

interface Values {
  name: string | null;
  detail: string | undefined;
  hidden: string;
}
type Props = RhfWizardRoutedStepProps<Values>;
type Save = NonNullable<Props['onSaveAndNext']>;
type Load = Props['loadStepValues'];

const initialValues: Values = { name: '', detail: '', hidden: '' };
const hard = Yup.object({
  name: Yup.string().required('Name is required'),
  hidden: Yup.string().required('Hidden field is required'),
});
const secondPath = '/wizard/second';
const firstPath = '/wizard/first';
const eligibleFinalStep: Partial<Props> = {
  currentStepIndex: 1,
  location: '/second',
  title: 'Second step',
  stepStatuses: [{ status: FormStepStatus.Completed }],
};

const Step = ({
  children,
}: PropsWithChildren<{ title: string; location: string }>) => <>{children}</>;
const steps = [
  <Step key='first' title='First step' location='/first'>
    <RhfTextInput name='name' label='Name' />
    <RhfTextInput name='detail' label='Detail' />
    <RhfHidableField name='hidden'>
      <RhfTextInput name='hidden' label='Hidden field' />
    </RhfHidableField>
  </Step>,
  <Step key='second' title='Second step' location='/second'>
    <RhfTextInput name='name' label='Name' />
  </Step>,
];

const renderStep = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    title: 'First step',
    location: '/first',
    url: '/wizard',
    initialValues,
    stepStatuses: [
      { status: FormStepStatus.NotStarted },
      { status: FormStepStatus.NotStarted },
    ],
    loadStepValues: () => ({ stepValues: initialValues }),
    allSteps: steps,
    currentStepIndex: 0,
    locationOnCompletion: '/done',
    locationAfterExit: '/draft',
    bannerTitle: 'Test wizard',
    validateHard: hard,
    hidingFields: { hidden: true },
    ...overrides,
  };
  const path = props.url + props.location;
  return {
    ...renderWithRouter(<RhfWizardRoutedStep {...props} />, {
      initialPath: path,
      extraRoutes: [
        ...(path === firstPath
          ? [{ path: secondPath, element: <h1>Next page</h1> }]
          : [{ path: firstPath, element: <h1>Previous page</h1> }]),
        { path: '/done', element: <h1>Done page</h1> },
        { path: '/draft', element: <h1>Draft page</h1> },
        { path: '/cancelled', element: <h1>Cancelled page</h1> },
      ],
    }),
    user: userEvent.setup(),
  };
};

const nextButton = () => screen.getByRole('button', { name: 'Save and next' });
const saveAndExit = () => screen.getByRole('button', { name: 'Save and exit' });
const nameInput = () => screen.getByRole('textbox', { name: 'Name' });
const waitForLoaded = () =>
  waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

describe(RhfWizardRoutedStep, () => {
  it('loads server values and replaces missing fields with empty values', async () => {
    expect.hasAssertions();

    const load = Promise.withResolvers<Awaited<ReturnType<Load>>>();
    const loadStepValues = vi.fn<Load>().mockReturnValue(load.promise);
    renderStep({
      loadStepValues,
      initialValues: {
        ...initialValues,
        name: 'Loading name',
        detail: 'Loading detail',
      },
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(loadStepValues).toHaveBeenCalledWith(expect.any(AbortSignal));

    await act(() => {
      load.resolve({
        stepValues: { name: null, detail: undefined, hidden: '' },
      });
      return load.promise;
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(nameInput()).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Detail' })).toHaveValue('');
  });

  it('uses the unprefixed title for a single-step wizard', async () => {
    expect.hasAssertions();

    renderStep({
      allSteps: steps.slice(0, 1),
      stepStatuses: [{ status: FormStepStatus.NotStarted }],
    });

    await waitForLoaded();

    expect(document.title).toBe('Test wizard | NMI Services portal');
  });

  it('shows the saving spinner and sends a normalized save-and-next payload before navigating', async () => {
    expect.hasAssertions();

    const save = Promise.withResolvers<undefined>();
    const onSaveAndNext = vi.fn<Save>().mockReturnValue(save.promise);
    const { user } = renderStep({
      loadStepValues: () => ({
        stepValues: { ...initialValues, hidden: 'private' },
      }),
      onSaveAndNext,
    });
    await waitForLoaded();

    expect(
      screen.queryByRole('textbox', { name: 'Hidden field' }),
    ).not.toBeInTheDocument();

    await user.type(nameInput(), 'Saved name');
    await user.click(nextButton());

    await expect(screen.findByText('Saving...')).resolves.toBeInTheDocument();
    expect(onSaveAndNext).toHaveBeenCalledExactlyOnceWith(
      { name: 'Saved name' },
      true,
      expect.any(AbortSignal),
    );

    await act(() => {
      save.resolve(undefined);
      return save.promise;
    });

    await expect(
      screen.findByRole('heading', { name: 'Next page' }),
    ).resolves.toBeInTheDocument();
  });

  it('uses soft validation for save and exit and navigates after saving the normalized draft', async () => {
    expect.hasAssertions();

    const onSaveAndExit = vi.fn<Save>();
    const onSaveAndNext = vi.fn<Save>();
    const { user } = renderStep({ onSaveAndExit, onSaveAndNext });
    await waitForLoaded();
    await user.type(
      screen.getByRole('textbox', { name: 'Detail' }),
      'Draft detail',
    );
    await user.click(saveAndExit());

    await expect(
      screen.findByRole('heading', { name: 'Draft page' }),
    ).resolves.toBeInTheDocument();
    expect(onSaveAndExit).toHaveBeenCalledExactlyOnceWith(
      { detail: 'Draft detail' },
      true,
      expect.any(AbortSignal),
    );
    expect(onSaveAndNext).not.toHaveBeenCalled();
  });

  it('returns to hard validation after a rejected draft', async () => {
    expect.hasAssertions();

    const onSaveAndExit = vi.fn<Save>().mockRejectedValue({ status: 403 });
    const onSaveAndNext = vi.fn<Save>();
    const { user } = renderStep({ onSaveAndExit, onSaveAndNext });
    await waitForLoaded();
    await user.click(saveAndExit());

    await expect(
      screen.findByText(/unable to process your request/),
    ).resolves.toBeInTheDocument();

    await user.click(nextButton());

    await expect(
      screen.findByText('Name is required'),
    ).resolves.toBeInTheDocument();
    expect(onSaveAndNext).not.toHaveBeenCalled();
    expect(
      screen.getByText(/unable to process your request/),
    ).toBeInTheDocument();
  });

  it('focuses and scrolls the error summary after invalid submit and updates it as fields change', async () => {
    expect.hasAssertions();

    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    const { user } = renderStep();
    await waitForLoaded();
    await user.click(nextButton());

    const summary = await screen.findByRole('alert');

    expect(
      within(summary).getByRole('link', { name: 'Name: Name is required' }),
    ).toHaveAttribute('href', '#name');
    expect(summary).not.toHaveTextContent('Hidden field is required');

    await waitFor(() => {
      expect(summary).toHaveFocus();
    });

    expect(scroll).toHaveBeenCalledTimes(1);

    await user.type(nameInput(), 'Valid');
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    scroll.mockRestore();
  });

  it('resets dirty edits on a conflict reload with deep-equal server values and keeps the banner', async () => {
    expect.hasAssertions();

    const initial = { ...initialValues, name: 'Server name' };
    const load = Promise.withResolvers<Awaited<ReturnType<Load>>>();
    const loadStepValues = vi
      .fn<Load>()
      .mockReturnValueOnce({ stepValues: initial })
      .mockReturnValueOnce(load.promise);
    const onSaveAndNext = vi.fn<Save>().mockRejectedValue({ status: 409 });
    const { user, router } = renderStep({ loadStepValues, onSaveAndNext });
    await waitForLoaded();
    await user.clear(nameInput());
    await user.type(nameInput(), 'Dirty edits');
    await user.click(nextButton());
    const banner = await screen.findByText(
      /another person has already saved this page/i,
    );

    expect(loadStepValues).toHaveBeenCalledTimes(2);

    await act(() => {
      load.resolve({ stepValues: { ...initial } });
      return load.promise;
    });

    expect(nameInput()).toHaveValue('Server name');
    expect(banner).toBeInTheDocument();

    await act(async () => {
      await router.navigate('/draft');
    });

    expect(
      screen.getByRole('heading', { name: 'Draft page' }),
    ).toBeInTheDocument();
  });

  it.each([
    [
      { status: 400, errors: { 'formStep.Name': ['Rejected name'] } },
      /Rejected name/,
    ],
    [{ status: 403 }, /unable to process your request/],
    [{ status: 422 }, /already submitted this form/],
    [
      {
        status: 403,
        headers: { server: 'Microsoft-Azure-Application-Gateway/v2' },
      },
      /contains invalid characters/,
    ],
  ])('renders the correct update error for %j', async (error, message) => {
    expect.hasAssertions();

    const onSaveAndNext = vi.fn<Save>().mockRejectedValue(error);
    const { user, currentPath } = renderStep({ onSaveAndNext });
    await waitForLoaded();
    await user.type(nameInput(), 'Try saving');
    await user.click(nextButton());

    await expect(screen.findByText(message)).resolves.toBeInTheDocument();
    expect(currentPath()).toBe(firstPath);
  });

  it('blocks dirty Back navigation so the user can stay or discard their edits', async () => {
    expect.hasAssertions();

    const { user } = renderStep({
      currentStepIndex: 1,
      location: '/second',
      title: 'Second step',
      stepStatuses: [
        { status: FormStepStatus.Completed },
        { status: FormStepStatus.NotStarted },
      ],
      previousButtonTitle: 'Previous details',
    });
    await waitForLoaded();
    const back = screen.getByRole('link', { name: 'Previous details' });

    expect(back).toHaveAttribute('href', firstPath);

    await user.type(nameInput(), 'Dirty edits');
    await user.click(back);
    const dialog = await screen.findByRole('dialog', {
      name: 'Unsaved changes',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });

    expect(nameInput()).toHaveValue('Dirty edits');

    await user.click(back);
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Discard changes',
      }),
    );

    await expect(
      screen.findByRole('heading', { name: 'Previous page' }),
    ).resolves.toBeInTheDocument();
  });

  it('redirects a direct visit to the first incomplete step', async () => {
    expect.hasAssertions();

    renderStep({ currentStepIndex: 1, location: '/second' });

    await expect(
      screen.findByRole('heading', { name: 'Previous page' }),
    ).resolves.toBeInTheDocument();
  });

  it('shows unlinked errors when final-step validation fails on a summary page', async () => {
    expect.hasAssertions();

    const onSaveAndNext = vi.fn<Save>();
    const { user } = renderStep({
      ...eligibleFinalStep,
      onSaveAndNext,
      isSummaryPage: true,
      lastStepNextButtonTitle: 'Finish',
      confirmationOnSubmission: {
        modalTitle: 'Confirm submission',
        modalBodyText: 'Submit this form?',
      },
    });
    await waitForLoaded();
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    const summary = await screen.findByRole('alert');

    expect(summary).toHaveTextContent('Name is required');
    expect(within(summary).queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onSaveAndNext).not.toHaveBeenCalled();
  });

  it('saves a valid final step only after confirming', async () => {
    expect.hasAssertions();

    const onSaveAndNext = vi.fn<Save>();
    const { user } = renderStep({
      ...eligibleFinalStep,
      onSaveAndNext,
      confirmationOnSubmission: {
        titleText: 'Confirm submission',
        bodyText: 'Submit this form?',
        noButtonTitle: 'Keep editing',
        yesButtonTitle: 'Send now',
      },
    });
    await waitForLoaded();
    await user.type(nameInput(), 'Ready');
    const finish = screen.getByRole('button', { name: 'Submit' });
    await user.click(finish);
    const confirmation = await screen.findByRole('dialog', {
      name: 'Confirm submission',
    });

    expect(onSaveAndNext).not.toHaveBeenCalled();

    await user.click(
      within(confirmation).getByRole('button', { name: 'Keep editing' }),
    );
    await waitFor(() => {
      expect(confirmation).not.toBeInTheDocument();
    });
    await user.click(finish);
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Send now',
      }),
    );

    await expect(
      screen.findByRole('heading', { name: 'Done page' }),
    ).resolves.toBeInTheDocument();
    expect(onSaveAndNext).toHaveBeenCalledExactlyOnceWith(
      { name: 'Ready' },
      true,
      expect.any(AbortSignal),
    );
  });

  it('uses default confirmation buttons when their labels are omitted', async () => {
    expect.hasAssertions();

    const { user } = renderStep({
      ...eligibleFinalStep,
      confirmationOnSubmission: {},
      loadStepValues: () => ({
        stepValues: { ...initialValues, name: 'Ready' },
      }),
    });
    await waitForLoaded();
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByRole('button', { name: 'No' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Yes' }),
    ).toBeInTheDocument();
  });

  it('leaves the wizard blank when the load requires signing out', async () => {
    expect.hasAssertions();

    const replace = vi.fn<Location['replace']>();
    const location = Object.create(globalThis.location) as Location;
    Object.defineProperty(location, 'replace', { value: replace });
    const locationMock = vi
      .spyOn(globalThis, 'location', 'get')
      .mockReturnValue(location);
    renderStep({
      loadStepValues: vi.fn<Load>().mockRejectedValue({ status: 410 }),
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/sign-out');
    });

    expect(screen.queryByRole('main')).not.toBeInTheDocument();

    locationMock.mockRestore();
  });

  it('respects disabled banner and next controls and follows the configured cancel route', async () => {
    expect.hasAssertions();

    const onDiscard = vi.fn<() => void>();
    const onCancel = vi.fn<() => void>();
    const { user } = renderStep({
      showBanner: false,
      showSaveAndNextButton: false,
      discard: {
        showCancelButton: true,
        cancelButtonTitle: 'Cancel wizard',
        locationOnCancel: '/cancelled',
        onDiscard,
        onCancel,
      },
    });
    await waitForLoaded();

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Save and next' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel wizard' }));

    await expect(
      screen.findByRole('heading', { name: 'Cancelled page' }),
    ).resolves.toBeInTheDocument();
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
