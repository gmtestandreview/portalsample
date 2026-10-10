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

describe('RhfNumberInput', () => {
  it('renders a labelled text box showing the form value', () => {
    render(
      <Harness defaultValue='123'>
        <RhfNumberInput name='amount' label='Amount' />
      </Harness>
    );
    const input = screen.getByRole('textbox', { name: 'Amount' });
    expect(input).toHaveValue('123');
    expect(input).toHaveAttribute('id', 'amount');
    expect(input).toHaveClass('form-field', 'form-text-input');
  });

  it('shows an empty box for nullish values and renders without a label', () => {
    render(
      <Harness defaultValue={null}>
        <RhfNumberInput name='amount' />
      </Harness>
    );
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('applies id, classes, placeholder, disabled and readonly', () => {
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
        <RhfNumberInput name='amount' label='Mobile' format='#### ### ###' />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), '0412345678');
    expect(screen.getByRole('textbox')).toHaveValue('0412 345 678');
    expect(screen.getByTestId('value')).toHaveTextContent('"0412 345 678"');
  });

  it('picks the phone pattern from the typed digits with checkPhoneFormat', async () => {
    render(
      <Harness>
        <RhfNumberInput name='amount' label='Phone' format='checkPhoneFormat' />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), '0291234567');
    expect(screen.getByRole('textbox')).toHaveValue('02 9123 4567');
  });

  it('formats numbers with separators, decimals and a prepend', async () => {
    render(
      <Harness>
        <RhfNumberInput
          name='amount'
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
      'input-prepend-amount'
    );
    await userEvent.type(screen.getByRole('textbox'), '1234.5');
    expect(screen.getByRole('textbox')).toHaveValue('1,234.50');
    expect(screen.getByTestId('value')).toHaveTextContent('"1,234.50"');
  });

  it('blocks a negative sign when negatives are not allowed', async () => {
    render(
      <Harness>
        <RhfNumberInput name='amount' label='Value' allowNegative={false} />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), '-5');
    expect(screen.getByRole('textbox')).toHaveValue('5');
  });

  it('does not reformat the stored value on blur', async () => {
    render(
      <Harness>
        <RhfNumberInput name='amount' label='Amount' format='#### ### ###' />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), '04');
    // The pattern input pads the unfilled slots with its default space mask.
    const padded = JSON.stringify('04'.padEnd('#### ### ###'.length));
    expect(screen.getByTestId('value').textContent).toBe(padded);
    await userEvent.tab();
    expect(screen.getByTestId('value').textContent).toBe(padded);
  });

  it('shows the inline help and links it to the input', () => {
    render(
      <Harness>
        <RhfNumberInput
          name='amount'
          label='Amount'
          inlineHelp='Include area'
        />
      </Harness>
    );
    expect(screen.getByText('Include area')).toHaveAttribute(
      'id',
      'help-amount'
    );
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'help-amount'
    );
  });

  it('hides the error until submit, then wires it up and focuses the input', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfNumberInput
          name='amount'
          label='Amount'
          inlineHelp='Include area'
        />
      </Harness>
    );
    const input = screen.getByRole('textbox');
    expect(screen.queryByText('Enter an amount')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveClass('is-invalid');
    await form.submit();
    expect(screen.getByText('Enter an amount')).toHaveAttribute(
      'id',
      'amount-validation-msg'
    );
    expect(input).toHaveClass('is-invalid');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      'help-amount amount-validation-msg'
    );
    expect(input).toHaveFocus();
  });

  it('shows the error once touched', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfNumberInput name='amount' label='Amount' prepend='+61' />
      </Harness>
    );
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();
    await form.trigger();
    expect(screen.getByText('Enter an amount')).toBeInTheDocument();
  });

  it('suppresses field level messages when asked', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfNumberInput
          name='amount'
          label='Amount'
          supressFieldLevelMessages
        />
      </Harness>
    );
    await form.submit();
    expect(screen.queryByText('Enter an amount')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveClass('is-invalid');
  });

  it('renders a formatted summary instead of an input', () => {
    render(
      <Harness defaultValue='0412345678'>
        <RhfNumberInput
          name='amount'
          label='Mobile'
          format='#### ### ###'
          isSummary
        />
      </Harness>
    );
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getByText('0412 345 678')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders a plain summary for a number without a format', () => {
    render(
      <Harness defaultValue='1,234.50'>
        <RhfNumberInput name='amount' label='Value' prepend='AUD$' isSummary />
      </Harness>
    );
    expect(screen.getByText('1,234.50')).toBeInTheDocument();
  });

  it('with format and valueIsNumericString still stores the formatted text (legacy parity)', async () => {
    render(
      <Harness>
        <RhfNumberInput
          name='amount'
          label='Mobile'
          format='#### ### ###'
          valueIsNumericString
        />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), '0412345678');
    expect(screen.getByRole('textbox')).toHaveValue('0412 345 678');
    expect(screen.getByTestId('value')).toHaveTextContent('"0412 345 678"');
  });
});
