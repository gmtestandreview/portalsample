import { describe, it, expect } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Field, Form, Formik, useFormikContext } from 'formik';

import type { FormikConfig, FormikValues } from 'formik';

import { useEffect } from 'react';

import { MemoryRouter, useLocation } from 'react-router';

import * as Yup from 'yup';

import Details from '@/components/forms/Details';

import FormBanner from '@/components/forms/FormBanner';

import HidableField from '@/components/forms/HidableField';

import UnsavedFormPrompt from '@/components/forms/UnsavedFormPrompt';

import countOfErrors from '@/components/forms/FormikForm/formikHelpers';

import { isHidden, removeHidden, validateForm } from '@/components/forms/utils';

vi.mock(
  import('@/components/RouteLeavingGuard'),
  () =>
    ({
      default: ({
        when,
        title,
        body,
        confirmBtn,
      }: {
        when?: boolean;
        title?: string;
        body?: string;
        confirmBtn?: string;
      }) => (
        <div
          data-testid='route-leaving-guard'
          data-when={String(Boolean(when))}
          data-title={title ?? ''}
          data-body={body ?? ''}
          data-confirm={confirmBtn ?? ''}
        />
      ),
    }) satisfies __ExactMockModule<__TestMockModule20>,
);

interface FormikHarnessProps<TValues extends FormikValues> {
  readonly initialValues: TValues;
  readonly initialStatus?: FormikConfig<TValues>['initialStatus'];
  readonly initialErrors?: FormikConfig<TValues>['initialErrors'];
  readonly initialTouched?: FormikConfig<TValues>['initialTouched'];
  readonly validate?: FormikConfig<TValues>['validate'];
  readonly onSubmit?: FormikConfig<TValues>['onSubmit'];
  readonly children: React.ReactNode;
}

function FormikHarness<TValues extends FormikValues>({
  initialValues,
  initialStatus,
  initialErrors,
  initialTouched,
  validate,
  onSubmit = async () => {},
  children,
}: FormikHarnessProps<TValues>) {
  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      {...(initialStatus === undefined ? {} : { initialStatus })}
      {...(initialErrors === undefined ? {} : { initialErrors })}
      {...(initialTouched === undefined ? {} : { initialTouched })}
      {...(validate === undefined ? {} : { validate })}
      onSubmit={onSubmit}
    >
      <Form>{children}</Form>
    </Formik>
  );
}

function LocationProbe() {
  const location = useLocation();
  return <p data-testid='location'>{location.pathname}</p>;
}

function AutoSubmit() {
  const { submitForm } = useFormikContext();
  useEffect(() => {
    void submitForm();
  }, [submitForm]);

  return null;
}

describe('form helper components', () => {
  it('renders Details as a native disclosure with supplied help content', async () => {
    expect.assertions(4);
    const user = userEvent.setup();
    render(
      <Details
        id='details-help'
        title='Why we ask'
        inlineHelp={<p>Used for service updates.</p>}
      />,
    );

    const disclosure = screen.getByText('Why we ask').closest('details');

    expect(disclosure).toHaveAttribute('id', 'details-help');
    expect(disclosure).not.toHaveAttribute('open');

    await user.click(screen.getByText('Why we ask'));

    expect(disclosure).toHaveAttribute('open');
    expect(screen.getByText('Used for service updates.')).toBeInTheDocument();
  });
});
