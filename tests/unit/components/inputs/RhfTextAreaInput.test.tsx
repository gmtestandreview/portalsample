import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen } from '@testing-library/react';

import type { ReactNode } from 'react';

import type { Resolver } from 'react-hook-form';

import { describe, expect, it } from 'vitest';

import RhfTextAreaInput from '@/components/Inputs/RhfTextAreaInput';

import { FieldHarness, createFormHandle } from './rhfTestHarness';

import type { FormHandle } from './rhfTestHarness';

interface Values {
  notes: string | null | undefined;
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
    field='notes'
    defaultValue={defaultValue}
    resolver={resolver}
    form={form}
  >
    {children}
  </FieldHarness>
);

const failingResolver: Resolver<Values> = async () => ({
  values: {},
  errors: { notes: { type: 'validation', message: 'Enter notes' } },
});

describe(RhfTextAreaInput, () => {
  it('renders a labelled textarea with defaults', () => {
    expect.assertions(4);
    render(
      <Harness defaultValue='Hello'>
        <RhfTextAreaInput name='notes' label='Notes' />
      </Harness>,
    );
    const input = screen.getByRole('textbox', { name: 'Notes' });

    expect(input).toHaveValue('Hello');
    expect(input).toHaveAttribute('rows', '3');
    expect(input).toHaveAttribute('id', 'notes');
    expect(input).toHaveClass('form-field', 'form-text-area');
  });
});

describe(RhfTextAreaInput, () => {
  it('shows an empty box for a nullish value', () => {
    expect.assertions(1);
    render(
      <Harness defaultValue={null}>
        <RhfTextAreaInput name='notes' label='Notes' />
      </Harness>,
    );

    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
