import { render, screen, within } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Form, Formik } from 'formik';

import type { FormikConfig, FormikValues } from 'formik';

import { describe, expect, it, vi } from 'vitest';

import CheckboxGroup from '@/components/Inputs/CheckboxGroup';

import { defined } from '../../helpers/defined';

interface FormikHarnessProps<TValues extends FormikValues> {
  readonly initialValues: TValues;
  readonly initialTouched?: FormikConfig<TValues>['initialTouched'];
  readonly initialErrors?: FormikConfig<TValues>['initialErrors'];
  readonly children: React.ReactNode;
}

function FormikHarness<TValues extends FormikValues>({
  initialValues,
  initialTouched,
  initialErrors,
  children,
}: FormikHarnessProps<TValues>) {
  return (
    <Formik
      initialValues={initialValues}
      {...(initialTouched === undefined ? {} : { initialTouched })}
      {...(initialErrors === undefined ? {} : { initialErrors })}
      onSubmit={async () => {}}
    >
      <Form>{children}</Form>
    </Formik>
  );
}

const contactOptions = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

describe(CheckboxGroup, () => {
  it('renders vertical options with plain inline help and validation feedback', () => {
    expect.assertions(1);
    render(
      <FormikHarness
        initialValues={{ contactMethod: '' }}
        initialTouched={{ contactMethod: true }}
        initialErrors={{ contactMethod: 'Choose at least one method' }}
      >
        <CheckboxGroup
          name='contactMethod'
          legend='Contact method'
          options={contactOptions}
          inlineHelp='Select every method we can use'
          containerClassName='contact-container'
          legendClassName='contact-legend'
          className='contact-checkbox'
        />
      </FormikHarness>,
    );
    const fieldset = screen.getByTestId('fs-contactMethod');
    expect(fieldset).toHaveAccessibleName('Contact method');
  });
});

describe(CheckboxGroup, () => {
  it('renders vertical options with plain inline help and validation feedback', () => {
    expect.assertions(1);
    render(
      <FormikHarness
        initialValues={{ contactMethod: '' }}
        initialTouched={{ contactMethod: true }}
        initialErrors={{ contactMethod: 'Choose at least one method' }}
      >
        <CheckboxGroup
          name='contactMethod'
          legend='Contact method'
          options={contactOptions}
          inlineHelp='Select every method we can use'
          containerClassName='contact-container'
          legendClassName='contact-legend'
          className='contact-checkbox'
        />
      </FormikHarness>,
    );
    const fieldset = screen.getByTestId('fs-contactMethod');
    expect(fieldset).toHaveAttribute(
      'aria-describedby',
      'contactMethod-validation-msg',
    );
  });
});

describe(CheckboxGroup, () => {
  it('renders vertical options with plain inline help and validation feedback', () => {
    expect.assertions(1);
    render(
      <FormikHarness
        initialValues={{ contactMethod: '' }}
        initialTouched={{ contactMethod: true }}
        initialErrors={{ contactMethod: 'Choose at least one method' }}
      >
        <CheckboxGroup
          name='contactMethod'
          legend='Contact method'
          options={contactOptions}
          inlineHelp='Select every method we can use'
          containerClassName='contact-container'
          legendClassName='contact-legend'
          className='contact-checkbox'
        />
      </FormikHarness>,
    );
    const fieldset = screen.getByTestId('fs-contactMethod');
    expect(screen.getByText('Select every method we can use')).toHaveAttribute(
      'id',
      'help-contactMethod',
    );
  });
});

describe(CheckboxGroup, () => {
  it('renders vertical options with plain inline help and validation feedback', () => {
    expect.assertions(1);
    render(
      <FormikHarness
        initialValues={{ contactMethod: '' }}
        initialTouched={{ contactMethod: true }}
        initialErrors={{ contactMethod: 'Choose at least one method' }}
      >
        <CheckboxGroup
          name='contactMethod'
          legend='Contact method'
          options={contactOptions}
          inlineHelp='Select every method we can use'
          containerClassName='contact-container'
          legendClassName='contact-legend'
          className='contact-checkbox'
        />
      </FormikHarness>,
    );
    const fieldset = screen.getByTestId('fs-contactMethod');
    expect(screen.getAllByText('Choose at least one method')).toHaveLength(3);
  });
});

describe(CheckboxGroup, () => {
  it('renders vertical options with plain inline help and validation feedback', () => {
    expect.assertions(1);
    render(
      <FormikHarness
        initialValues={{ contactMethod: '' }}
        initialTouched={{ contactMethod: true }}
        initialErrors={{ contactMethod: 'Choose at least one method' }}
      >
        <CheckboxGroup
          name='contactMethod'
          legend='Contact method'
          options={contactOptions}
          inlineHelp='Select every method we can use'
          containerClassName='contact-container'
          legendClassName='contact-legend'
          className='contact-checkbox'
        />
      </FormikHarness>,
    );
    const fieldset = screen.getByTestId('fs-contactMethod');
    expect(screen.getAllByText('Choose at least one method')[0]).toHaveClass(
      'form-validation-message',
    );
  });
});
