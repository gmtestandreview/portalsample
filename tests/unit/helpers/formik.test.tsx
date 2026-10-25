import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Field, ErrorMessage } from 'formik';

import { describe, expect, it } from 'vitest';

import * as yup from 'yup';

import '../../../ClientApp/src/validationSchemas/yupExtensions';

import { FormikWrapper, createSubmitSpy } from './formik';

const schema = yup.object({
  name: yup.string().label('Name').isRequired(),
});

describe('formik harness', () => {
  it('still renders children against initialValues', () => {
    expect.assertions(1);
    // Backward compatibility. buttonControls.test.tsx uses the original three-prop signature and
    // the additions below must not disturb it.
    render(
      <FormikWrapper initialValues={{ name: 'Existing' }}>
        <Field name='name' data-testid='name' />
      </FormikWrapper>,
    );

    expect(screen.getByTestId('name')).toHaveValue('Existing');
  });
});

describe('formik harness', () => {
  it('surfaces schema validation messages when fields start touched', async () => {
    expect.assertions(1);
    render(
      <FormikWrapper
        initialValues={{ name: '' }}
        validationSchema={schema}
        initialTouched
      >
        <Field name='name' data-testid='name' />
        <ErrorMessage name='name' component='span' data-testid='name-error' />
      </FormikWrapper>,
    );

    // Without a schema Formik reports no errors at all, and an "invalid input is rejected"
    // assertion would pass without testing anything.
    await waitFor(() =>
      expect(screen.getByTestId('name-error')).toBeInTheDocument(),
    );
  });
});

describe('formik harness', () => {
  it('captures submitted values through the submit spy', async () => {
    expect.assertions(2);
    const user = userEvent.setup();
    const submit = createSubmitSpy<{ name: string }>();

    render(
      <FormikWrapper
        initialValues={{ name: 'Initial' }}
        onSubmit={submit.onSubmit}
      >
        <Field name='name' data-testid='name' />
        <button type='submit'>Save</button>
      </FormikWrapper>,
    );

    await user.clear(screen.getByTestId('name'));
    await user.type(screen.getByTestId('name'), 'Updated');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(submit.submitCount()).toBe(1));

    expect(submit.lastValues()).toEqual({ name: 'Updated' });
  });
});
