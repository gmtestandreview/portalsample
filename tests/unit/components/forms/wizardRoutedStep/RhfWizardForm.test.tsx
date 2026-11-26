import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FormStepStatus } from '@/api/web-api-client';
import RhfTextInput from '@/components/Inputs/RhfTextInput';
import RhfWizardForm from '@/components/forms/WizardForm/RhfWizardForm';
import WizardStep from '@/components/forms/WizardForm/WizardStep';
import type { WizardStepProps } from '@/components/forms/WizardForm/types';
import { RouterProvider, createMemoryRouter } from 'react-router';

interface Values {
  name: string;
}

type Save = NonNullable<WizardStepProps<Values>['onSaveAndNext']>;

const createStep = (
  location: string,
  title: string,
  onSaveAndNext: Save,
  onSaveAndExit?: Save,
): WizardStepProps<Values> => ({
  title,
  location,
  initialValues: { name: '' },
  // The first step is complete so the second can be opened directly.
  stepStatuses: [
    { status: FormStepStatus.Completed },
    { status: FormStepStatus.NotStarted },
  ],
  loadStepValues: () => ({ stepValues: { name: `Loaded ${title}` } }),
  onSaveAndNext,
  ...(onSaveAndExit === undefined ? {} : { onSaveAndExit }),
  bannerTitle: 'Banner',
});

const renderWizard = (
  onFirst: Save,
  onSecond: Save,
  onExit?: Save,
  initialPath = '/flow/1/one',
) => {
  const router = createMemoryRouter(
    [
      {
        path: '/flow/:id',
        children: [
          {
            path: '*',
            element: (
              <RhfWizardForm
                locationOnCompletion='/done'
                canSaveDraft
                lastStepNextButtonTitle='Submit'
                nextButtonTitle='Save and next'
                previousButtonTitle='Back'
              >
                <WizardStep {...createStep('/one', 'First', onFirst, onExit)}>
                  <RhfTextInput name='name' label='Name' />
                </WizardStep>
                <WizardStep {...createStep('/two', 'Second', onSecond)}>
                  <RhfTextInput name='name' label='Name' />
                </WizardStep>
              </RhfWizardForm>
            ),
          },
        ],
      },
      { path: '/done', element: <h1>Done page</h1> },
    ],
    { initialEntries: [initialPath] },
  );
  render(<RouterProvider router={router} />);

  return { currentPath: () => router.state.location.pathname };
};

describe(RhfWizardForm, () => {
  it('saves a step, moves to the next step and completes after the last', async () => {
    expect.hasAssertions();

    const onFirst = vi.fn<Save>().mockResolvedValue(undefined);
    const onSecond = vi.fn<Save>().mockResolvedValue(undefined);
    const { currentPath } = renderWizard(onFirst, onSecond);

    await screen.findByDisplayValue('Loaded First');
    await userEvent.click(
      screen.getByRole('button', { name: 'Save and next' }),
    );

    await expect(
      screen.findByDisplayValue('Loaded Second'),
    ).resolves.toBeInTheDocument();
    expect(onFirst).toHaveBeenCalledWith(
      { name: 'Loaded First' },
      expect.any(Boolean),
      expect.any(AbortSignal),
    );

    await waitFor(() => {
      expect(currentPath()).toBe('/flow/1/two');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await expect(
      screen.findByRole('heading', { name: 'Done page' }),
    ).resolves.toBeInTheDocument();
    expect(onSecond).toHaveBeenCalledTimes(1);
  });

  it('goes back to the previous step', async () => {
    expect.hasAssertions();

    const { currentPath } = renderWizard(
      vi.fn<Save>().mockResolvedValue(undefined),
      vi.fn<Save>().mockResolvedValue(undefined),
      undefined,
      '/flow/1/two',
    );

    await screen.findByDisplayValue('Loaded Second');
    await userEvent.click(screen.getByRole('link', { name: /Back/ }));

    await waitFor(() => {
      expect(currentPath()).toBe('/flow/1/one');
    });
  });

  it('redirects an unknown path to the last step', async () => {
    expect.hasAssertions();

    const { currentPath } = renderWizard(
      vi.fn<Save>().mockResolvedValue(undefined),
      vi.fn<Save>().mockResolvedValue(undefined),
      undefined,
      '/flow/1/unknown',
    );

    await expect(
      screen.findByDisplayValue('Loaded Second'),
    ).resolves.toBeInTheDocument();

    await waitFor(() => {
      expect(currentPath()).toBe('/flow/1/two');
    });
  });

  it('rejects a child that is not a wizard step', async () => {
    expect.hasAssertions();

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <RhfWizardForm locationOnCompletion='/done'>
              {'text' as unknown as React.ReactElement}
            </RhfWizardForm>
          ),
        },
      ],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    await expect(
      screen.findByText(
        'RhfWizardForm only accepts children of type WizardStep',
      ),
    ).resolves.toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('renders no routes when there are no children', () => {
    expect.hasAssertions();

    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <RhfWizardForm locationOnCompletion='/done'>
              {null as unknown as React.ReactElement}
            </RhfWizardForm>
          ),
        },
      ],
      { initialEntries: ['/'] },
    );
    const { container } = render(<RouterProvider router={router} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('rejects an empty entry nested inside the children', async () => {
    expect.hasAssertions();

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <RhfWizardForm locationOnCompletion='/done'>
              {[null] as unknown as React.ReactElement}
            </RhfWizardForm>
          ),
        },
      ],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    await expect(
      screen.findByText(
        'RhfWizardForm only accepts children of type WizardStep',
      ),
    ).resolves.toBeInTheDocument();

    consoleError.mockRestore();
  });
});
