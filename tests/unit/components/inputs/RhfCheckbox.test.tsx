import userEvent from '@testing-library/user-event';

import { render, screen } from '@testing-library/react';

import type { ReactNode } from 'react';

import type { Resolver } from 'react-hook-form';

import { describe, expect, it, vi } from 'vitest';

import RhfCheckbox from '@/components/Inputs/RhfCheckbox';

import { FieldHarness, createFormHandle } from './rhfTestHarness';

import type { FormHandle } from './rhfTestHarness';

interface Values {
  accepted: boolean | null | undefined;
}

const Harness = ({
  defaultValue = false,
  resolver,
  form,
  children,
}: Readonly<{
  defaultValue?: boolean | null | undefined;
  resolver?: Resolver<Values>;
  form?: FormHandle<Values>;
  children: ReactNode;
}>) => (
  <FieldHarness<Values>
    field='accepted'
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
    accepted: { type: 'validation', message: 'You must accept' },
  },
});

describe(RhfCheckbox, () => {
  it('renders a labelled checkbox reflecting the form value', () => {
    expect.assertions(2);
    render(
      <Harness defaultValue>
        <RhfCheckbox name='accepted' label='I accept' />
      </Harness>,
    );

    const box = screen.getByRole('checkbox', { name: 'I accept' });

    expect(box).toBeChecked();
    expect(box).toHaveAttribute('id', 'accepted');
  });
});

describe(RhfCheckbox, () => {
  it('is unchecked for nullish form values', () => {
    expect.assertions(2);
    const { unmount } = render(
      <Harness defaultValue={null}>
        <RhfCheckbox name='accepted' label='I accept' />
      </Harness>,
    );

    expect(screen.getByRole('checkbox')).not.toBeChecked();

    unmount();

    render(
      <Harness defaultValue={undefined}>
        <RhfCheckbox name='accepted' label='I accept' />
      </Harness>,
    );

    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
