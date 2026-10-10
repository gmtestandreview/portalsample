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

describe('RhfTextInput', () => {
  it('renders a labelled text box showing the form value', () => {
    render(
      <Harness defaultValue='Acme'>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>
    );

    const input = screen.getByRole('textbox', { name: 'Organisation' });
    expect(input).toHaveValue('Acme');
    expect(input).toHaveAttribute('id', 'organisationName');
    expect(input).toHaveClass('form-field', 'form-text-input');
  });

  it('shows an empty box for nullish form values', () => {
    const { unmount } = render(
      <Harness defaultValue={null}>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>
    );
    expect(screen.getByRole('textbox')).toHaveValue('');
    unmount();

    render(
      <Harness defaultValue={undefined}>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>
    );
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('applies id, class names and optional attributes', () => {
    render(
      <Harness>
        <RhfTextInput
          name='organisationName'
          label='Organisation'
          id='org'
          className='extra'
          containerClassName='wrap'
          placeholder='Name'
          autoComplete='organization'
          disabled
          readonly
        />
      </Harness>
    );

    const input = screen.getByRole('textbox', { name: 'Organisation' });
    expect(input).toHaveAttribute('id', 'org');
    expect(input).toHaveClass('extra');
    expect(input).toHaveAttribute('placeholder', 'Name');
    expect(input).toHaveAttribute('autocomplete', 'organization');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('readonly');
    expect(input.closest('.form-field-container')).toHaveClass('wrap');
  });

  it('stores typed text and calls onChange with the new text', async () => {
    const onChange = vi.fn();
    render(
      <Harness>
        <RhfTextInput
          name='organisationName'
          label='Organisation'
          onChange={onChange}
        />
      </Harness>
    );

    await userEvent.type(screen.getByRole('textbox'), 'Hi');

    expect(screen.getByTestId('value')).toHaveTextContent('"Hi"');
    expect(onChange).toHaveBeenLastCalledWith('Hi');
  });

  it('updates the form value without an onChange callback', async () => {
    render(
      <Harness>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>
    );

    await userEvent.type(screen.getByRole('textbox'), 'A');

    expect(screen.getByTestId('value')).toHaveTextContent('"A"');
  });

  it('trims surrounding whitespace when the field loses focus', async () => {
    const onBlur = vi.fn();
    render(
      <Harness>
        <RhfTextInput
          name='organisationName'
          label='Organisation'
          onBlur={onBlur}
        />
      </Harness>
    );

    await userEvent.type(screen.getByRole('textbox'), '  Acme  ');
    await userEvent.tab();

    expect(screen.getByTestId('value')).toHaveTextContent('"Acme"');
    expect(screen.getByRole('textbox')).toHaveValue('Acme');
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('leaves an already trimmed or nullish value untouched on blur', async () => {
    render(
      <Harness defaultValue={null}>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>
    );

    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();

    expect(screen.getByTestId('value')).toHaveTextContent('null');
  });

  it('shows the inline help and links it to the input', () => {
    render(
      <Harness>
        <RhfTextInput
          name='organisationName'
          label='Organisation'
          inlineHelp='Legal name'
        />
      </Harness>
    );

    expect(screen.getByText('Legal name')).toHaveAttribute(
      'id',
      'help-organisationName'
    );
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'help-organisationName'
    );
  });

  it('shows the inline help inside a titled details disclosure', () => {
    render(
      <Harness>
        <RhfTextInput
          name='organisationName'
          label='Organisation'
          inlineHelp='Legal name'
          inlineHelpTitle='What is this?'
        />
      </Harness>
    );

    expect(screen.getByText('What is this?')).toBeInTheDocument();
    expect(screen.getByText('Legal name')).toBeInTheDocument();
  });

  it('shows the validation message only after a submit attempt', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>
    );
    const input = screen.getByRole('textbox', { name: 'Organisation' });
    expect(screen.queryByText('Enter a name')).not.toBeInTheDocument();

    await form.submit();

    expect(screen.getByText('Enter a name')).toHaveAttribute(
      'id',
      'organisationName-validation-msg'
    );
    expect(input).toHaveClass('is-invalid');
    expect(input).toHaveAttribute(
      'aria-describedby',
      'organisationName-validation-msg'
    );
  });

  it('shows the validation message once the field has been touched', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>
    );

    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();
    await form.trigger();

    expect(screen.getByText('Enter a name')).toBeInTheDocument();
  });

  it('describes the input by both the help and the validation message', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfTextInput
          name='organisationName'
          label='Organisation'
          inlineHelp='Legal name'
        />
      </Harness>
    );

    await form.submit();

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute(
      'aria-describedby',
      'help-organisationName organisationName-validation-msg'
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('describes the input by the titled details id and the validation message', async () => {
    const form = createFormHandle<Values>();
    const { container } = render(
      <Harness form={form} resolver={failingResolver}>
        <RhfTextInput
          name='organisationName'
          label='Organisation'
          inlineHelp='Legal name'
          inlineHelpTitle='What is this?'
        />
      </Harness>
    );

    await form.submit();

    expect(container.querySelector('details')).toHaveAttribute(
      'id',
      'help-organisationName'
    );
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'help-organisationName organisationName-validation-msg'
    );
  });

  it('is not marked invalid while the error is hidden', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>
    );

    await form.trigger();

    expect(screen.queryByText('Enter a name')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('textbox')).not.toHaveClass('is-invalid');
  });

  it('focuses the invalid input when a submit attempt fails', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfTextInput name='organisationName' label='Organisation' />
      </Harness>
    );

    await form.submit();

    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('suppresses field level messages when asked', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfTextInput
          name='organisationName'
          label='Organisation'
          inlineHelp='Legal name'
          supressFieldLevelMessages
        />
      </Harness>
    );

    await form.submit();

    const input = screen.getByRole('textbox');
    expect(screen.queryByText('Enter a name')).not.toBeInTheDocument();
    expect(input).not.toHaveClass('is-invalid');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAttribute('aria-describedby', 'help-organisationName');
  });

  it('renders a summary line instead of an input', () => {
    render(
      <Harness defaultValue='Acme'>
        <RhfTextInput name='organisationName' label='Organisation' isSummary />
      </Harness>
    );

    expect(screen.getByText('Organisation')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
