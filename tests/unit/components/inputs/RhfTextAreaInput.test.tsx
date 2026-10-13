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

describe('RhfTextAreaInput', () => {
  it('renders a labelled textarea with defaults', () => {
    render(
      <Harness defaultValue='Hello'>
        <RhfTextAreaInput name='notes' label='Notes' />
      </Harness>
    );
    const input = screen.getByRole('textbox', { name: 'Notes' });
    expect(input).toHaveValue('Hello');
    expect(input).toHaveAttribute('rows', '3');
    expect(input).toHaveAttribute('id', 'notes');
    expect(input).toHaveClass('form-field', 'form-text-area');
  });

  it('shows an empty box for a nullish value', () => {
    render(
      <Harness defaultValue={null}>
        <RhfTextAreaInput name='notes' label='Notes' />
      </Harness>
    );
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('applies optional attributes', () => {
    render(
      <Harness>
        <RhfTextAreaInput
          name='notes'
          label='Notes'
          id='n'
          rows={5}
          className='extra'
          containerClassName='wrap'
          placeholder='Type'
          disabled
        />
      </Harness>
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'n');
    expect(input).toHaveAttribute('rows', '5');
    expect(input).toHaveClass('extra');
    expect(input).toHaveAttribute('placeholder', 'Type');
    expect(input).toBeDisabled();
    expect(input.closest('.form-field-container')).toHaveClass('wrap');
  });

  it('stores typed text, keeping line breaks', async () => {
    render(
      <Harness>
        <RhfTextAreaInput name='notes' label='Notes' />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), 'a{Enter}b');
    expect(screen.getByTestId('value')).toHaveTextContent('"a\\nb"');
  });

  it('strips supplementary-plane characters', () => {
    render(
      <Harness>
        <RhfTextAreaInput name='notes' label='Notes' />
      </Harness>
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'hi \u{1F600} there' },
    });
    expect(screen.getByRole('textbox')).toHaveValue('hi  there');
  });

  it('trims on blur', async () => {
    render(
      <Harness>
        <RhfTextAreaInput name='notes' label='Notes' />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), '  Acme  ');
    await userEvent.tab();
    expect(screen.getByTestId('value')).toHaveTextContent('"Acme"');
  });

  it('leaves an already trimmed value alone on blur', async () => {
    render(
      <Harness defaultValue='Acme'>
        <RhfTextAreaInput name='notes' label='Notes' />
      </Harness>
    );
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();
    expect(screen.getByTestId('value')).toHaveTextContent('"Acme"');
  });

  it('turns a null value into an empty string on blur like the legacy twin', async () => {
    render(
      <Harness defaultValue={null}>
        <RhfTextAreaInput name='notes' label='Notes' />
      </Harness>
    );
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();
    expect(screen.getByTestId('value')).toHaveTextContent('""');
  });

  it('shows a character counter that flags overflow', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfTextAreaInput name='notes' label='Notes' maxCharacters={3} />
      </Harness>
    );
    expect(screen.getByText('0 of 3 characters used')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), 'abcd');
    const counter = screen.getByText('4 of 3 characters used');
    expect(counter.parentElement).toHaveClass('counterLabelExceedsMax');
    await form.submit();
    expect(screen.getByText(', 4 of 3 characters used')).toHaveClass(
      'visually-hidden'
    );
  });

  it('marks the counter as within the maximum', async () => {
    render(
      <Harness>
        <RhfTextAreaInput name='notes' label='Notes' maxCharacters={10} />
      </Harness>
    );
    await userEvent.type(screen.getByRole('textbox'), 'ab');
    expect(
      screen.getByText('2 of 10 characters used').parentElement
    ).toHaveClass('counterLabelWithinMax');
  });

  it('shows no counter without a positive maxCharacters', () => {
    render(
      <Harness>
        <RhfTextAreaInput name='notes' label='Notes' maxCharacters={0} />
      </Harness>
    );
    expect(screen.queryByText(/characters used/)).not.toBeInTheDocument();
  });

  it('counts a nullish value as zero', () => {
    render(
      <Harness defaultValue={null}>
        <RhfTextAreaInput name='notes' label='Notes' maxCharacters={5} />
      </Harness>
    );
    expect(screen.getByText('0 of 5 characters used')).toBeInTheDocument();
  });

  it('links the inline help to the textarea', () => {
    render(
      <Harness>
        <RhfTextAreaInput name='notes' label='Notes' inlineHelp='Be brief' />
      </Harness>
    );
    expect(screen.getByText('Be brief')).toHaveAttribute('id', 'help-notes');
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'help-notes'
    );
  });

  it('hides the error until submit, then shows it with accessibility wiring', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfTextAreaInput name='notes' label='Notes' inlineHelp='Be brief' />
      </Harness>
    );
    const input = screen.getByRole('textbox');
    expect(screen.queryByText('Enter notes')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid');
    await form.submit();
    expect(screen.getByText('Enter notes')).toHaveAttribute(
      'id',
      'notes-validation-msg'
    );
    expect(input).toHaveClass('is-invalid');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      'help-notes notes-validation-msg'
    );
    expect(input).toHaveFocus();
  });

  it('shows the error once touched', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfTextAreaInput name='notes' label='Notes' />
      </Harness>
    );
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();
    await form.trigger();
    expect(screen.getByText('Enter notes')).toBeInTheDocument();
  });

  it('suppresses field level messages when asked', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfTextAreaInput
          name='notes'
          label='Notes'
          supressFieldLevelMessages
        />
      </Harness>
    );
    await form.submit();
    expect(screen.queryByText('Enter notes')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveClass('is-invalid');
  });

  it('renders a summary instead of an input', () => {
    render(
      <Harness defaultValue='Line'>
        <RhfTextAreaInput name='notes' label='Notes' isSummary />
      </Harness>
    );
    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders no label element for an empty label', () => {
    const { container } = render(
      <Harness>
        <RhfTextAreaInput name='notes' label='' />
      </Harness>
    );
    expect(container.querySelector('label')).toBeNull();
  });
});
