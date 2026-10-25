import { describe, beforeEach, it, expect } from 'vitest';

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Form, useFormikContext } from 'formik';

import { MemoryRouter } from 'react-router';

import FormikForm from '@/components/forms/FormikForm';

import ErrorSummary from '@/components/forms/ErrorSummary';

import ContactDetailsInput from '@/components/forms/CommonForms/ContactDetails';

import { HttpStatusCode } from '@/types';

import * as Yup from 'yup';

vi.mock(
  import('@/components/forms/UnsavedFormPrompt'),
  () =>
    ({
      default: () => <div data-testid='unsaved-form-prompt' />,
    }) satisfies __ExactMockModule<__TestMockModule21>,
);

vi.mock(
  import('@/components/BlockUISpinner'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <output>{children}</output>
      ),
    }) satisfies __ExactMockModule<__TestMockModule14>,
);

function ValuesProbe() {
  const { values, setFieldValue, submitForm } =
    useFormikContext<Record<string, unknown>>();
  return (
    <>
      <pre data-testid='values'>{JSON.stringify(values)}</pre>
      <button
        type='button'
        onClick={async () => {
          await setFieldValue('saveAndExit', true);
          await submitForm();
        }}
      >
        Save draft
      </button>
    </>
  );
}

describe('form shell behavior slice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('formikForm validates hard, renders function children, and submits normalized values', async () => {
    expect.assertions(3);
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const validateHard = vi
      .fn()
      .mockReturnValueOnce({ firstName: 'First name is required' })
      .mockReturnValue({});

    render(
      <MemoryRouter>
        <FormikForm
          initialValues={{
            firstName: '',
            keep: 'value',
            emptyValue: '',
            submitClick: true,
          }}
          validateHard={validateHard}
          onSubmit={onSubmit}
          promptPath='/form'
          showBanner={false}
        >
          {({ errors, handleSubmit, setFieldValue }) => (
            <Form onSubmit={handleSubmit}>
              <div>{errors.firstName as string}</div>
              <button
                type='button'
                onClick={() => setFieldValue('firstName', 'Alex')}
              >
                Fill name
              </button>
              <button type='submit'>Submit</button>
            </Form>
          )}
        </FormikForm>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await expect(
      screen.findByText('First name is required'),
    ).resolves.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Fill name' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { firstName: 'Alex', keep: 'value' },
        expect.objectContaining({ setSubmitting: expect.any(Function) }),
      ),
    );
  });
});
