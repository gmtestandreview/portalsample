import { describe, it, expect } from 'vitest';

import { render, screen, waitFor, within } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Form, Formik, useFormikContext } from 'formik';

import type { FormikConfig, FormikValues } from 'formik';

import Checkbox from '@/components/Inputs/Checkbox';

import RadioButton from '@/components/Inputs/RadioButton';

import RadioButtonGroup from '@/components/Inputs/RadioButtonGroup';

import SelectInput from '@/components/Inputs/SelectInput';

import TextAreaInput from '@/components/Inputs/TextAreaInput';

import TextInput from '@/components/Inputs/TextInput';

import TextReadOnly from '@/components/Inputs/TextReadOnly';

interface FormikHarnessProps<TValues extends FormikValues> {
  readonly initialValues: TValues;
  readonly initialTouched?: FormikConfig<TValues>['initialTouched'];
  readonly initialErrors?: FormikConfig<TValues>['initialErrors'];
  readonly onSubmit?: FormikConfig<TValues>['onSubmit'];
  readonly children: React.ReactNode;
}

function FormikHarness<TValues extends FormikValues>({
  initialValues,
  initialTouched,
  initialErrors,
  onSubmit = async () => {},
  children,
}: FormikHarnessProps<TValues>) {
  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      {...(initialTouched === undefined ? {} : { initialTouched })}
      {...(initialErrors === undefined ? {} : { initialErrors })}
      onSubmit={onSubmit}
    >
      <Form>{children}</Form>
    </Formik>
  );
}

function ValuesProbe() {
  const { values, touched } = useFormikContext<Record<string, unknown>>();
  return (
    <>
      <pre data-testid='values'>{JSON.stringify(values)}</pre>
      <pre data-testid='touched'>{JSON.stringify(touched)}</pre>
    </>
  );
}

describe('simple Formik input components', () => {
  it('associates Checkbox label/help text and updates the form value', async () => {
    expect.assertions(4);
    const user = userEvent.setup();

    render(
      <FormikHarness initialValues={{ accepted: false }}>
        <Checkbox
          name='accepted'
          label='I accept the terms'
          descriptor='Required before continuing'
          inlineHelp='Confirm you have read the terms'
        />
        <ValuesProbe />
      </FormikHarness>,
    );

    const checkbox = screen.getByRole('checkbox', {
      name: /I accept the terms/i,
    });

    expect(checkbox).toHaveAccessibleDescription(
      'Confirm you have read the terms',
    );
    expect(document.querySelector('.icon-tick')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(document.querySelector('.icon-tick')).not.toHaveAttribute('role');

    await user.click(checkbox);

    await waitFor(() =>
      expect(screen.getByTestId('values')).toHaveTextContent('"accepted":true'),
    );
  });
});
