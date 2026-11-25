import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik, useFormikContext } from 'formik';
import { describe, expect, it } from 'vitest';
import { useFormikRhfBridge } from '@/components/forms/useFormikRhfBridge';
import type { BridgedValues } from '@/components/forms/useFormikRhfBridge';
import type { Path } from 'react-hook-form';

interface BridgeValues extends BridgedValues {
  profile: { name: string };
  external: string;
  saveAndExit?: boolean;
}

const touchPaths = [
  'profile.name',
  'external',
] as const satisfies readonly Path<BridgeValues>[];

const isBridgedName = (name: string) => name === 'profile.name';

const BridgeFields = () => {
  const methods = useFormikRhfBridge<BridgeValues>({
    softSchema: undefined,
    hardSchema: undefined,
    touchPaths,
    isBridgedName,
  });
  const { values, submitForm } = useFormikContext<BridgeValues>();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm();
      }}
    >
      <input aria-label='Bridged name' {...methods.register('profile.name')} />
      <input aria-label='Unbridged value' {...methods.register('external')} />
      <button type='submit'>Submit outer form</button>
      <output data-testid='formik-values'>{JSON.stringify(values)}</output>
      <output data-testid='rhf-values'>
        {JSON.stringify(methods.getValues())}
      </output>
      <output data-testid='rhf-touched'>
        {JSON.stringify(methods.formState.touchedFields)}
      </output>
    </form>
  );
};

const renderBridge = (initialValues: BridgeValues) =>
  render(
    <Formik
      initialValues={initialValues}
      onSubmit={() => undefined}
      enableReinitialize
    >
      <BridgeFields />
    </Formik>,
  );

describe('useFormikRhfBridge', () => {
  it('mirrors only bridged React Hook Form edits into Formik values', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderBridge({ profile: { name: 'Initial' }, external: 'Outer value' });

    await user.clear(screen.getByRole('textbox', { name: 'Bridged name' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Bridged name' }),
      'Updated',
    );
    await user.clear(screen.getByRole('textbox', { name: 'Unbridged value' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Unbridged value' }),
      'RHF only',
    );

    await waitFor(() => {
      expect(
        JSON.parse(screen.getByTestId('formik-values').textContent),
      ).toStrictEqual({
        profile: { name: 'Updated' },
        external: 'Outer value',
      });
    });
    expect(
      JSON.parse(screen.getByTestId('formik-values').textContent),
    ).toMatchObject({ external: 'Outer value' });
  });

  it('resets on Formik reinitialization and touches bridged paths on submit', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const { rerender } = renderBridge({
      profile: { name: 'Before reset' },
      external: 'Before reset',
      saveAndExit: true,
    });

    rerender(
      <Formik
        initialValues={{
          profile: { name: 'After reset' },
          external: 'After reset',
          saveAndExit: true,
        }}
        onSubmit={() => undefined}
        enableReinitialize
      >
        <BridgeFields />
      </Formik>,
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Bridged name' })).toHaveValue(
        'After reset',
      );
    });

    await user.click(screen.getByRole('button', { name: 'Submit outer form' }));

    await waitFor(() => {
      expect(
        JSON.parse(screen.getByTestId('rhf-values').textContent),
      ).toMatchObject({ saveAndExit: true });
      expect(
        JSON.parse(screen.getByTestId('rhf-touched').textContent),
      ).toStrictEqual({ profile: { name: true }, external: true });
    });
  });
});
