import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import RhfForm from '@/components/forms/RhfForm';
import SaveAndExitButton from '@/components/forms/SaveAndExitButton';
import SubmitFormButton from '@/components/forms/SubmitFormButton';

interface ButtonFormValues {
  name: string;
}

type ButtonSubmit = (values: ButtonFormValues) => undefined | Promise<unknown>;

const renderButtons = (children: ReactNode) => {
  const onSubmit = vi.fn<ButtonSubmit>();
  const onSaveAndExit = vi.fn<ButtonSubmit>();

  render(
    <RhfForm<ButtonFormValues>
      initialValues={{ name: 'Alex' }}
      onSubmit={onSubmit}
      onSaveAndExit={onSaveAndExit}
    >
      {({ onFormSubmit }) => <form onSubmit={onFormSubmit}>{children}</form>}
    </RhfForm>,
  );

  return { onSubmit, onSaveAndExit };
};

describe('form button controls', () => {
  it('renders SaveAndExitButton default text and runs the save and exit intent', async () => {
    expect.hasAssertions();

    const { onSubmit, onSaveAndExit } = renderButtons(<SaveAndExitButton />);

    await userEvent.click(screen.getByTestId('save-and-exit-button'));

    await waitFor(() => {
      expect(onSaveAndExit).toHaveBeenCalledTimes(1);
    });

    expect(onSaveAndExit.mock.calls[0]?.[0]).toStrictEqual({ name: 'Alex' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders SaveAndExitButton via render prop', async () => {
    expect.hasAssertions();

    const { onSaveAndExit } = renderButtons(
      <SaveAndExitButton>
        {(onClick) => (
          <button type='button' onClick={onClick}>
            Custom save
          </button>
        )}
      </SaveAndExitButton>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Custom save' }));

    await waitFor(() => {
      expect(onSaveAndExit).toHaveBeenCalledTimes(1);
    });
  });

  it('renders SubmitFormButton default text and runs the next intent', async () => {
    expect.hasAssertions();

    const { onSubmit, onSaveAndExit } = renderButtons(<SubmitFormButton />);

    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit.mock.calls[0]?.[0]).toStrictEqual({ name: 'Alex' });
    expect(onSaveAndExit).not.toHaveBeenCalled();
  });

  it('renders SubmitFormButton via render prop', async () => {
    expect.hasAssertions();

    const { onSubmit } = renderButtons(
      <SubmitFormButton>
        {(onClick) => (
          <button type='button' onClick={onClick}>
            Custom submit
          </button>
        )}
      </SubmitFormButton>,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Custom submit' }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
