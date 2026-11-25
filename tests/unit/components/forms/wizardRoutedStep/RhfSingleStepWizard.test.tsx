import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as Yup from 'yup';
import { FormStepStatus } from '@/api/web-api-client';
import RhfTextInput from '@/components/Inputs/RhfTextInput';
import RhfSingleStepWizard from '@/components/forms/WizardForm/RhfSingleStepWizard';
import type { WizardStepProps } from '@/components/forms/WizardForm/types';
import { renderWithRouter } from '../../../helpers/renderWithRouter';

interface Values {
  name: string;
}

type Save = NonNullable<WizardStepProps<Values>['onSaveAndNext']>;

const createStep = (onSaveAndNext: Save): WizardStepProps<Values> => ({
  title: 'Single step',
  location: '/',
  initialValues: { name: '' },
  stepStatuses: [{ status: FormStepStatus.NotStarted }],
  loadStepValues: () => ({ stepValues: { name: 'Loaded name' } }),
  validateHard: Yup.object({ name: Yup.string().required('Name is required') }),
  onSaveAndNext,
  bannerTitle: 'Single step banner',
});

const renderWizard = (
  onSaveAndNext: Save,
  initialPath = '/flow',
  path = '/flow/*',
) =>
  renderWithRouter(
    <RhfSingleStepWizard
      wizard={{
        locationOnCompletion: '/done',
        lastStepNextButtonTitle: 'Finish',
        canSaveDraft: false,
      }}
      step={createStep(onSaveAndNext)}
    >
      <RhfTextInput name='name' label='Name' />
    </RhfSingleStepWizard>,
    {
      path,
      initialPath,
      extraRoutes: [{ path: '/done', element: <h1>Done page</h1> }],
    },
  );

describe(RhfSingleStepWizard, () => {
  it('loads, saves the normalised values and navigates to the completion location', async () => {
    expect.hasAssertions();

    const onSaveAndNext = vi.fn<Save>().mockResolvedValue(undefined);
    const { currentPath } = renderWizard(onSaveAndNext);

    const name = await screen.findByDisplayValue('Loaded name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Edited name');
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    await waitFor(() => {
      expect(onSaveAndNext).toHaveBeenCalledWith(
        { name: 'Edited name' },
        expect.any(Boolean),
        expect.any(AbortSignal),
      );
    });

    await expect(
      screen.findByRole('heading', { name: 'Done page' }),
    ).resolves.toBeInTheDocument();
    expect(currentPath()).toBe('/done');
  });

  it('blocks the save when validation fails', async () => {
    expect.hasAssertions();

    const onSaveAndNext = vi.fn<Save>().mockResolvedValue(undefined);
    renderWizard(onSaveAndNext);

    const name = await screen.findByDisplayValue('Loaded name');
    await userEvent.clear(name);
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    await expect(
      screen.findByRole('link', { name: 'Name: Name is required' }),
    ).resolves.toBeInTheDocument();
    expect(onSaveAndNext).not.toHaveBeenCalled();
  });

  it('resolves the base url when mounted at the application root', async () => {
    expect.hasAssertions();

    renderWizard(vi.fn<Save>().mockResolvedValue(undefined), '/', '/*');

    await expect(
      screen.findByDisplayValue('Loaded name'),
    ).resolves.toBeInTheDocument();
  });
});
