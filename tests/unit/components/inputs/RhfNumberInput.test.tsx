import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Resolver, UseFormReturn } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import RhfNumberInput from '@/components/Inputs/RhfNumberInput';
import { FieldHarness, submitForm } from './rhfTestHarness';

interface Values {
  phone: string | null | undefined;
}

let formMethods: UseFormReturn<Values> | undefined;

const Harness = ({
  defaultValue = '',
  resolver,
  children,
}: Readonly<{
  defaultValue?: string | null | undefined;
  resolver?: Resolver<Values>;
  children: ReactNode;
}>) => (
  <FieldHarness<Values>
    field='phone'
    defaultValue={defaultValue}
    resolver={resolver}
    onMethods={(methods) => {
      formMethods = methods;
    }}
  >
    {children}
  </FieldHarness>
);

const failingResolver: Resolver<Values> = async () => ({
  values: {},
  errors: { phone: { type: 'validation', message: 'Enter a phone' } },
});

const submit = () => submitForm(formMethods as never);

describe('RhfNumberInput', () => {
  it('renders a labelled text box showing the form value', () => {
    render(
      <Harness defaultValue='123'>
        <RhfNumberInput name='phone' label='Phone' />
      </Harness>
    );
    const input = screen.getByRole('textbox', { name: 'Phone' });
    expect(input).toHaveValue('123');
    expect(input).toHaveAttribute('id', 'phone');
    expect(input).toHaveClass('form-field', 'form-text-input');
  });

  it('shows an empty box for nullish values and renders without a label', () => {
    render(
      <Harness defaultValue={null}>
        <RhfNumberInput name='phone' />
      </Harness>
    );
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('applies id, classes, placeholder, disabled and readonly', () => {
    render(
      <Harness>
        <RhfNumberInput
          name='phone'
          label='Phone'
          id='p'
          className='extra'
          containerClassName='wrap'
          placeholder='0.00'
          maxLength={5}
          disabled
          readonly
        />
      </Harness>
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'p');
    expect(input).toHaveClass('extra');
    expect(input).toHaveAttribute('placeholder', '0.00');
    expect(input).toHaveAttribute('maxlength', '5');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('readonly');
    expect(input.closest('.form-field-container')).toHaveClass('wrap');
  });

  it('stores the fixed-pattern formatted text as typed', async () => {
    render(
      <Harness>
        <RhfNumberInput name='phone' label='Mobile' format='#### ### ###' />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), '0412345678');
    expect(screen.getByRole('textbox')).toHaveValue('0412 345 678');
    expect(screen.getByTestId('value')).toHaveTextContent('"0412 345 678"');
  });

  it('picks the phone pattern from the typed digits with checkPhoneFormat', async () => {
    render(
      <Harness>
        <RhfNumberInput name='phone' label='Phone' format='checkPhoneFormat' />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), '0291234567');
    expect(screen.getByRole('textbox')).toHaveValue('02 9123 4567');
  });

  it('formats numbers with separators, decimals and a prepend', async () => {
    render(
      <Harness>
        <RhfNumberInput
          name='phone'
          label='Value'
          prepend='AUD$'
          thousandSeparator
          fixedDecimalScale
          decimalScale={2}
          allowNegative={false}
          valueIsNumericString
        />
      </Harness>
    );
    expect(screen.getByText('AUD$')).toHaveAttribute(
      'id',
      'input-prepend-phone'
    );
    await userEvent.type(screen.getByRole('textbox'), '1234.5');
    expect(screen.getByRole('textbox')).toHaveValue('1,234.50');
    expect(screen.getByTestId('value')).toHaveTextContent('"1,234.50"');
  });

  it('blocks a negative sign when negatives are not allowed', async () => {
    render(
      <Harness>
        <RhfNumberInput name='phone' label='Value' allowNegative={false} />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), '-5');
    expect(screen.getByRole('textbox')).toHaveValue('5');
  });

  it('does not reformat the stored value on blur', async () => {
    render(
      <Harness>
        <RhfNumberInput name='phone' label='Phone' format='#### ### ###' />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), '04');
    await userEvent.tab();
    expect(screen.getByTestId('value')).toHaveTextContent('"04');
  });

  it('shows the inline help and links it to the input', () => {
    render(
      <Harness>
        <RhfNumberInput name='phone' label='Phone' inlineHelp='Include area' />
      </Harness>
    );
    expect(screen.getByText('Include area')).toHaveAttribute(
      'id',
      'help-phone'
    );
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'help-phone'
    );
  });

  it('hides the error until submit, then wires it up and focuses the input', async () => {
    render(
      <Harness resolver={failingResolver}>
        <RhfNumberInput name='phone' label='Phone' inlineHelp='Include area' />
      </Harness>
    );
    const input = screen.getByRole('textbox');
    expect(screen.queryByText('Enter a phone')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveClass('is-invalid');
    await submit();
    expect(screen.getByText('Enter a phone')).toHaveAttribute(
      'id',
      'phone-validation-msg'
    );
    expect(input).toHaveClass('is-invalid');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      'help-phone phone-validation-msg'
    );
    expect(input).toHaveFocus();
  });

  it('shows the error once touched', async () => {
    render(
      <Harness resolver={failingResolver}>
        <RhfNumberInput name='phone' label='Phone' prepend='+61' />
      </Harness>
    );
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();
    await act(async () => {
      await formMethods?.trigger();
    });
    expect(screen.getByText('Enter a phone')).toBeInTheDocument();
  });

  it('suppresses field level messages when asked', async () => {
    render(
      <Harness resolver={failingResolver}>
        <RhfNumberInput name='phone' label='Phone' supressFieldLevelMessages />
      </Harness>
    );
    await submit();
    expect(screen.queryByText('Enter a phone')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveClass('is-invalid');
  });

  it('renders a formatted summary instead of an input', () => {
    render(
      <Harness defaultValue='0412345678'>
        <RhfNumberInput
          name='phone'
          label='Mobile'
          format='#### ### ###'
          isSummary
        />
      </Harness>
    );
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getAllByText(/0412 345 678/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders a plain summary for a number without a format', () => {
    render(
      <Harness defaultValue='1,234.50'>
        <RhfNumberInput name='phone' label='Value' prepend='AUD$' isSummary />
      </Harness>
    );
    expect(screen.getAllByText(/1,234\.50/).length).toBeGreaterThan(0);
  });
});
