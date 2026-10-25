import { describe, it, expect, vi } from 'vitest';

import { act, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import * as Yup from 'yup';

import RhfTextInput from '../../../../ClientApp/src/components/Inputs/RhfTextInput';

import type { Hideable } from '../../../../ClientApp/src/components/forms/types';

import { renderRhfShell } from '../../helpers/rhfShell';

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

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
    expect.assertions(4);
    const { user } = setup();

    expect(screen.queryByText('Name is required')).toBeNull();

    await user.click(screen.getByLabelText('Name'));
    await user.tab();

    await expect(
      screen.findByText('Name is required'),
    ).resolves.toBeInTheDocument();
    expect(screen.queryByText('Other is required')).toBeNull();

    await user.type(screen.getByLabelText('Name'), 'a');
    await waitFor(() =>
      expect(screen.queryByText('Name is required')).toBeNull(),
    );
  });
});
