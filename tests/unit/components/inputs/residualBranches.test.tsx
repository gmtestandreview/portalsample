import { describe, afterEach, it, expect } from 'vitest';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Form, Formik } from 'formik';

import AutoSuggestContainer from '@/components/Inputs/AutoSuggest/AutoSuggestContainer';

import Checkbox from '@/components/Inputs/Checkbox';

import OrganisationNameLookup from '@/components/Inputs/OrganisationNameLookup';

import NumberInput from '@/components/Inputs/NumberInput';

import RadioButtonGroup from '@/components/Inputs/RadioButtonGroup';

import SelectInput from '@/components/Inputs/SelectInput';

import TextAreaInput from '@/components/Inputs/TextAreaInput';

import TextInput from '@/components/Inputs/TextInput';

import { installUnexpectedConsoleGuard } from '../../../helpers/unexpectedConsoleGuard';

interface HarnessProps {
  readonly children: React.ReactNode;
  readonly initialValues: Record<string, unknown>;
  readonly initialErrors?: Record<string, string>;
  readonly initialTouched?: Record<string, boolean>;
}

function Harness({
  children,
  initialValues,
  initialErrors,
  initialTouched,
}: HarnessProps) {
  return (
    <Formik
      initialValues={initialValues}
      {...(initialErrors === undefined ? {} : { initialErrors })}
      {...(initialTouched === undefined ? {} : { initialTouched })}
      onSubmit={vi.fn()}
    >
      <Form>{children}</Form>
    </Formik>
  );
}

describe('residual input branches', () => {
  installUnexpectedConsoleGuard();
  afterEach(cleanup);
  afterEach(() => {
    vi.useRealTimers();
  });
  it('renders SelectInput horizontal plain help without validation', () => {
    expect.assertions(2);
    render(
      <Harness initialValues={{ state: '' }}>
        <SelectInput
          name='state'
          label='State'
          displayHorizontally
          inlineHelp='Choose the service state'
          options={[]}
        />
      </Harness>,
    );

    expect(
      screen.getByRole('combobox', { name: 'State' }),
    ).toHaveAccessibleDescription('Choose the service state');
    expect(screen.queryByText(/validation/i)).not.toBeInTheDocument();
  });
});

describe('residual input branches', () => {
  installUnexpectedConsoleGuard();
  afterEach(cleanup);
  afterEach(() => {
    vi.useRealTimers();
  });
  it('covers SelectInput partial validation states in both layouts', () => {
    expect.assertions(2);
    const { rerender } = render(
      <Harness initialValues={{ state: '' }} initialTouched={{ state: true }}>
        <SelectInput name='state' label='State' options={[]} />
      </Harness>,
    );

    expect(screen.getByRole('combobox', { name: 'State' })).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );

    rerender(
      <Harness
        initialValues={{ state: '' }}
        initialErrors={{ state: 'Choose a state' }}
      >
        <SelectInput
          name='state'
          label='State'
          displayHorizontally
          options={[]}
        />
      </Harness>,
    );

    expect(screen.queryByText('Choose a state')).not.toBeInTheDocument();
  });
});
