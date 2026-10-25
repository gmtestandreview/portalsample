import userEvent from '@testing-library/user-event';

import { act, render, screen } from '@testing-library/react';

import { useEffect } from 'react';

import type { ReactNode } from 'react';

import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import type { Resolver, UseFormReturn } from 'react-hook-form';

import { describe, expect, it, vi } from 'vitest';

import RhfSelectInput from '@/components/Inputs/RhfSelectInput';

const options = [
  { displayText: 'Certificate', value: 'cert' },
  { displayText: 'Manuals', value: 'manual', disabled: true },
];

interface Values {
  category: string | number;
}

let formMethods: UseFormReturn<Values> | undefined;

const ValueProbe = () => {
  const { watch } = useFormContext<Values>();
  return (
    <output data-testid='value'>{JSON.stringify(watch('category'))}</output>
  );
};

const Harness = ({
  defaultValue = '',
  resolver,
  children,
}: Readonly<{
  defaultValue?: string | number;
  resolver?: Resolver<Values>;
  children: ReactNode;
}>) => {
  const methods = useForm<Values>({
    defaultValues: { category: defaultValue },
    ...(resolver === undefined ? {} : { resolver }),
  });
  useEffect(() => {
    formMethods = methods;
  });
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
      <ValueProbe />
    </FormProvider>
  );
};

const failingResolver: Resolver<Values> = async () => ({
  values: {},
  errors: {
    category: { type: 'validation', message: 'Select a category' },
  },
});

describe(RhfSelectInput, () => {
  it('renders the label, a blank option and the given options', () => {
    expect.assertions(3);
    render(
      <Harness>
        <RhfSelectInput
          name='category'
          label='Category'
          options={options}
          addBlank
          containerClassName='extra'
          className='form-select-sm'
        />
      </Harness>,
    );

    const select = screen.getByRole('combobox', { name: 'Category' });

    expect(select).toHaveClass('form-select-sm');
    expect(screen.getByRole('option', { name: 'Please select' })).toHaveValue(
      '',
    );
    expect(screen.getByRole('option', { name: 'Manuals' })).toBeDisabled();
  });
});

describe(RhfSelectInput, () => {
  it('uses a custom blank label and renders no options when none are given', () => {
    expect.assertions(2);
    render(
      <Harness>
        <RhfSelectInput
          name='category'
          label='Category'
          addBlank
          defaultDisplayText='Select'
        />
      </Harness>,
    );

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Select' })).toBeInTheDocument();
  });
});
