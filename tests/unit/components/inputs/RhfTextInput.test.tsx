import userEvent from '@testing-library/user-event';

import { render, screen } from '@testing-library/react';

import type { ReactNode } from 'react';

import type { Resolver } from 'react-hook-form';

import { describe, expect, it, vi } from 'vitest';

import RhfTextInput from '@/components/Inputs/RhfTextInput';

import { FieldHarness, createFormHandle } from './rhfTestHarness';

import type { FormHandle } from './rhfTestHarness';

interface Values {
  organisationName: string | null | undefined;
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
    field='organisationName'
    defaultValue={defaultValue}
    resolver={resolver}
    form={form}
  >
    {children}
  </FieldHarness>
);

const failingResolver: Resolver<Values> = async () => ({
  values: {},
  errors: {
    organisationName: { type: 'validation', message: 'Enter a name' },
  },
});

describe(RhfTextInput, () => {
  it('renders a labelled text box showing the form value', () => {
    expect.assertions(3);
    render(
      <Harness defaultValue='Acme'>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>,
    );

    const input = screen.getByRole('textbox', { name: 'Organisation' });

    expect(input).toHaveValue('Acme');
    expect(input).toHaveAttribute('id', 'organisationName');
    expect(input).toHaveClass('form-field', 'form-text-input');
  });
});

describe(RhfTextInput, () => {
  it('shows an empty box for nullish form values', () => {
    expect.assertions(2);
    const { unmount } = render(
      <Harness defaultValue={null}>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>,
    );

    expect(screen.getByRole('textbox')).toHaveValue('');

    unmount();

    render(
      <Harness defaultValue={undefined}>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>,
    );

    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
