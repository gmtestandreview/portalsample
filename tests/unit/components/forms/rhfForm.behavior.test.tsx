import { describe, it, expect, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Yup from 'yup';
import RhfTextInput from '../../../../ClientApp/src/components/Inputs/RhfTextInput';
import type { Hideable } from '../../../../ClientApp/src/components/forms/types';
import { renderRhfShell } from '../../helpers/rhfShell';

vi.mock(import('../../../../ClientApp/src/instrumentation/AppLogger'), () => ({
  default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
}));

interface Values {
  name: string;
  other: string;
}

const hard = Yup.object({
  name: Yup.string().required('Name is required'),
  other: Yup.string().required('Other is required'),
});
const soft = Yup.object({});

const fields = (
  <>
    <RhfTextInput name='name' label='Name' />
    <RhfTextInput name='other' label='Other' />
  </>
);

interface SetupOptions {
  initialValues?: Values;
  validateHard?: typeof hard | undefined;
  validateSoft?: typeof soft | undefined;
  hidingFields?: Hideable;
  onSaveAndExit?: (values: Values) => Promise<unknown>;
  noExitHandler?: boolean;
}

const setup = (options: SetupOptions = {}) => {
  const onSubmit = vi.fn(async (_values: Values) => undefined);
  const onSaveAndExit =
    options.onSaveAndExit ?? vi.fn(async (_values: Values) => undefined);
  const baseProps = {
    initialValues: options.initialValues ?? { name: '', other: '' },
    validateHard: 'validateHard' in options ? options.validateHard : hard,
    validateSoft: 'validateSoft' in options ? options.validateSoft : soft,
    onSubmit,
    ...(options.hidingFields ? { hidingFields: options.hidingFields } : {}),
    ...(options.noExitHandler ? {} : { onSaveAndExit }),
  };
  const view = renderRhfShell<Values>(baseProps, fields);
  return {
    ...view,
    baseProps,
    onSubmit,
    onSaveAndExit,
    user: userEvent.setup(),
  };
};

// Let trailing async validation land inside act before the test moves on.
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

describe('rhfForm shell behavior', () => {
  it('shows an error after the first blur, not before, and clears it on change', async () => {
    const { user } = setup();

    expect(screen.queryByText('Name is required')).toBeNull();

    await user.click(screen.getByLabelText('Name'));
    await user.tab();

    await expect(screen.findByText('Name is required')).resolves.toBe(true);
    expect(screen.queryByText('Other is required')).toBeNull();

    await user.type(screen.getByLabelText('Name'), 'a');
    await waitFor(() =>
      expect(screen.queryByText('Name is required')).toBeNull()
    );
  });

  it('shows every error after an invalid submit without moving focus or submitting', async () => {
    const { user, onSubmit } = setup();

    await user.click(screen.getByTestId('next'));

    await expect(screen.findByText('Name is required')).resolves.toBe(true);
    expect(screen.getByText('Other is required')).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
    // shouldFocusError is off: the summary, not RHF, owns focus (D-2).
    expect(document.activeElement).toBe(screen.getByTestId('next'));
  });

  it('submits once on Enter', async () => {
    const { user, onSubmit } = setup();

    await user.type(screen.getByLabelText('Name'), 'abc');
    await user.type(screen.getByLabelText('Other'), 'xyz{Enter}');

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'abc', other: 'xyz' });
  });

  it('strips hidden fields and drops their validation errors', async () => {
    const { user, onSubmit } = setup({
      hidingFields: { other: true },
      initialValues: { name: '', other: 'hidden value' },
    });

    await user.type(screen.getByLabelText('Name'), 'abc');
    await user.click(screen.getByTestId('next'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'abc' });
  });

  it('save and exit validates softly and calls onSaveAndExit with the payload', async () => {
    const { user, onSubmit, onSaveAndExit } = setup({
      initialValues: { name: 'kept', other: '' },
    });

    await user.click(screen.getByTestId('save-and-exit'));

    await waitFor(() => expect(onSaveAndExit).toHaveBeenCalledTimes(1));

    expect(onSaveAndExit).toHaveBeenCalledWith({ name: 'kept' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('returns to the hard schema after a failed save and exit', async () => {
    const onSaveAndExit = vi.fn(async (_values: Values) => {
      throw new Error('boom');
    });
    const { user } = setup({ onSaveAndExit });

    await user.click(screen.getByTestId('save-and-exit'));
    await waitFor(() => expect(onSaveAndExit).toHaveBeenCalledTimes(1));
    await settle();

    // Formik kept the soft schema here (quirk Q1); the shell does not.
    await user.click(screen.getByLabelText('Name'));
    await user.tab();

    await expect(screen.findByText('Name is required')).resolves.toBe(true);
  });

  it('falls back to onSubmit for save and exit when no exit handler is given', async () => {
    const { user, onSubmit } = setup({
      noExitHandler: true,
      initialValues: { name: 'a', other: 'b' },
    });

    await user.click(screen.getByTestId('save-and-exit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('resets on a new initialValues object, not on a re-render with the same one', async () => {
    const { user, rerenderShell, baseProps } = setup();
    await user.type(screen.getByLabelText('Name'), 'typed');
    await user.click(screen.getByTestId('next'));
    await screen.findByText('Other is required');

    rerenderShell({ ...baseProps });
    await settle();

    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'typed'
    );
    expect(screen.getByText('Other is required')).toBe(true);

    rerenderShell({
      ...baseProps,
      initialValues: { name: 'from server', other: '' },
    });
    await waitFor(() =>
      expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
        'from server'
      )
    );

    expect(screen.queryByText('Other is required')).toBeNull();
  });

  it('lets a form without schemas submit freely', async () => {
    const { user, onSubmit } = setup({
      validateHard: undefined,
      validateSoft: undefined,
    });

    await user.click(screen.getByTestId('next'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(onSubmit).toHaveBeenCalledWith({});
  });
});
