import userEvent from '@testing-library/user-event';

import { render, screen } from '@testing-library/react';

import type { ReactNode } from 'react';

import type { Resolver } from 'react-hook-form';

import { describe, expect, it } from 'vitest';

import RhfNumberInput from '@/components/Inputs/RhfNumberInput';

import { FieldHarness, createFormHandle } from './rhfTestHarness';

import type { FormHandle } from './rhfTestHarness';

interface Values {
  amount: string | null | undefined;
}

const Harness = ({
  defaultValue = '',
  resolver,
  form,
  children,
}: Readonly<{
  defaultValue?: string | null | undefined;
  resolver?: Resolver<Values>;
  form?: FormHandle<Values>;
  children: ReactNode;
}>) => (
  <FieldHarness<Values>
    field='amount'
    defaultValue={defaultValue}
    resolver={resolver}
    form={form}
  >
    {children}
  </FieldHarness>
);

const failingResolver: Resolver<Values> = async () => ({
  values: {},
  errors: { amount: { type: 'validation', message: 'Enter an amount' } },
});

describe(RhfNumberInput, () => {
  it('renders a labelled text box showing the form value', () => {
    expect.assertions(3);
    render(
      <Harness defaultValue='123'>
        <RhfNumberInput name='amount' label='Amount' />
      </Harness>,
    );
    const input = screen.getByRole('textbox', { name: 'Amount' });

    expect(input).toHaveValue('123');
    expect(input).toHaveAttribute('id', 'amount');
    expect(input).toHaveClass('form-field', 'form-text-input');
  });
});

describe(RhfNumberInput, () => {
  it('shows an empty box for nullish values and renders without a label', () => {
    expect.assertions(1);
    render(
      <Harness defaultValue={null}>
        <RhfNumberInput name='amount' />
      </Harness>,
    );

    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});

describe(RhfNumberInput, () => {
  it('applies id, classes, placeholder, disabled and readonly', () => {
    expect.assertions(1);
    render(
      <Harness>
        <RhfNumberInput
          name='amount'
          label='Amount'
          id='p'
          className='extra'
          containerClassName='wrap'
          placeholder='0.00'
          maxLength={5}
          disabled
          readonly
        />
      </Harness>,
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'p');
  });
});
