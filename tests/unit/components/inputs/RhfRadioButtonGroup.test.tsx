import userEvent from '@testing-library/user-event';

import { render, screen } from '@testing-library/react';

import type { ReactNode } from 'react';

import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import { describe, expect, it, vi } from 'vitest';

import RhfRadioButtonGroup from '@/components/Inputs/RhfRadioButtonGroup';

const options = [
  { label: 'All', value: 'all', id: 'opt-all' },
  { label: 'Open', value: 'open', id: 'opt-open' },
];

interface Values {
  status: string | boolean;
}

const ValueProbe = () => {
  const { watch } = useFormContext<Values>();
  return <output data-testid='value'>{String(watch('status'))}</output>;
};

const Harness = ({
  defaultValue = 'all',
  children,
}: Readonly<{ defaultValue?: string | boolean; children: ReactNode }>) => {
  const methods = useForm<Values>({ defaultValues: { status: defaultValue } });
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
      <ValueProbe />
    </FormProvider>
  );
};

interface SubmittableProps {
  inlineHelp?: string | undefined;
  required?: boolean;
}

/** Group inside a submittable form, so tests can trigger validation. */
const Submittable = ({
  inlineHelp,
  required = true,
}: Readonly<SubmittableProps>) => {
  const methods = useForm<Values>({ defaultValues: { status: '' } });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => undefined)}>
        <RhfRadioButtonGroup
          name='status'
          id='q-status'
          legend='Status'
          options={options}
          {...(inlineHelp ? { inlineHelp } : {})}
          {...(required ? { rules: { required: 'Choose a status' } } : {})}
        />
        <button type='submit'>submit</button>
      </form>
    </FormProvider>
  );
};

describe(RhfRadioButtonGroup, () => {
  it('checks the option matching the form value', () => {
    expect.assertions(2);
    render(
      <Harness defaultValue='open'>
        <RhfRadioButtonGroup name='status' legend='Status' options={options} />
      </Harness>,
    );

    expect(screen.getByLabelText('Open')).toBeChecked();
    expect(screen.getByLabelText('All')).not.toBeChecked();
  });
});

describe(RhfRadioButtonGroup, () => {
  it('updates the form value and calls onChange when an option is chosen', async () => {
    expect.assertions(3);
    const onChange = vi.fn();
    render(
      <Harness>
        <RhfRadioButtonGroup
          name='status'
          legend='Status'
          options={options}
          onChange={onChange}
        />
      </Harness>,
    );

    await userEvent.click(screen.getByLabelText('Open'));

    expect(screen.getByTestId('value')).toHaveTextContent('open');
    expect(screen.getByLabelText('Open')).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
