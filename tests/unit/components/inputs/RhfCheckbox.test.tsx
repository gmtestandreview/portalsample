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

describe('RhfCheckbox', () => {
  it('renders a labelled checkbox reflecting the form value', () => {
    render(
      <Harness defaultValue>
        <RhfCheckbox name='accepted' label='I accept' />
      </Harness>
    );

    const box = screen.getByRole('checkbox', { name: 'I accept' });
    expect(box).toBeChecked();
    expect(box).toHaveAttribute('id', 'accepted');
  });

  it('is unchecked for nullish form values', () => {
    const { unmount } = render(
      <Harness defaultValue={null}>
        <RhfCheckbox name='accepted' label='I accept' />
      </Harness>
    );
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    unmount();

    render(
      <Harness defaultValue={undefined}>
        <RhfCheckbox name='accepted' label='I accept' />
      </Harness>
    );
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('applies id, class names, descriptor and disabled state', () => {
    render(
      <Harness>
        <RhfCheckbox
          name='accepted'
          label='I accept'
          id='accept-box'
          className='extra'
          containerClassName='wrap'
          descriptor='Read the terms first'
          disabled
        />
      </Harness>
    );

    const box = screen.getByRole('checkbox');
    expect(box).toHaveAttribute('id', 'accept-box');
    expect(box).toBeDisabled();
    expect(screen.getByText('Read the terms first')).toBeInTheDocument();
    expect(box.closest('.checkbox')).toHaveClass('extra');
    expect(box.closest('.form-field-container')).toHaveClass('wrap');
  });

  it('stores a boolean and calls onChange with it', async () => {
    const onChange = vi.fn();
    render(
      <Harness>
        <RhfCheckbox name='accepted' label='I accept' onChange={onChange} />
      </Harness>
    );

    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByTestId('value')).toHaveTextContent('true');
    expect(onChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByTestId('value')).toHaveTextContent('false');
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('updates the form value without an onChange callback', async () => {
    render(
      <Harness>
        <RhfCheckbox name='accepted' label='I accept' />
      </Harness>
    );

    await userEvent.click(screen.getByLabelText('I accept'));

    expect(screen.getByTestId('value')).toHaveTextContent('true');
  });

  it('shows inline help and links it to the checkbox', () => {
    render(
      <Harness>
        <RhfCheckbox name='accepted' label='I accept' inlineHelp='Required' />
      </Harness>
    );

    expect(screen.getByText('Required')).toHaveAttribute('id', 'help-accepted');
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-describedby',
      'help-accepted'
    );
  });

  it('renders the sub form field', () => {
    render(
      <Harness>
        <RhfCheckbox
          name='accepted'
          label='I accept'
          subFormField={<span>Extra detail</span>}
        />
      </Harness>
    );

    expect(screen.getByText('Extra detail')).toBeInTheDocument();
  });

  it('shows the validation message only after a submit attempt', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfCheckbox name='accepted' label='I accept' />
      </Harness>
    );
    const box = screen.getByRole('checkbox');
    expect(screen.queryByText('You must accept')).not.toBeInTheDocument();

    await form.submit();

    expect(screen.getByText('You must accept')).toHaveAttribute(
      'id',
      'accepted-validation-msg'
    );
    expect(box).toHaveAttribute('aria-describedby', 'accepted-validation-msg');
  });

  it('shows the validation message once the field has been touched', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfCheckbox name='accepted' label='I accept' />
      </Harness>
    );

    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.tab();
    await form.trigger();

    expect(screen.getByText('You must accept')).toBeInTheDocument();
  });

  it('suppresses field level messages when asked', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfCheckbox
          name='accepted'
          label='I accept'
          supressFieldLevelMessages
        />
      </Harness>
    );

    await form.submit();

    expect(screen.queryByText('You must accept')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toHaveAttribute(
      'aria-describedby'
    );
  });

  it('marks the checkbox invalid and describes it by help and error', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfCheckbox name='accepted' label='I accept' inlineHelp='Required' />
      </Harness>
    );

    await form.submit();

    const box = screen.getByRole('checkbox');
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveClass('is-invalid');
    expect(box).toHaveAttribute(
      'aria-describedby',
      'help-accepted accepted-validation-msg'
    );
  });

  it('is not marked invalid while the error is hidden', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfCheckbox name='accepted' label='I accept' />
      </Harness>
    );

    await form.trigger();

    const box = screen.getByRole('checkbox');
    expect(screen.queryByText('You must accept')).not.toBeInTheDocument();
    expect(box).not.toHaveAttribute('aria-invalid');
    expect(box).not.toHaveClass('is-invalid');
  });

  it('focuses the invalid checkbox when a submit attempt fails', async () => {
    const form = createFormHandle<Values>();
    render(
      <Harness form={form} resolver={failingResolver}>
        <RhfCheckbox name='accepted' label='I accept' />
      </Harness>
    );

    await form.submit();

    expect(screen.getByRole('checkbox')).toHaveFocus();
  });

  it('renders Yes or No in summary mode', () => {
    const { unmount } = render(
      <Harness defaultValue>
        <RhfCheckbox name='accepted' label='I accept' isSummary />
      </Harness>
    );
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    unmount();

    render(
      <Harness>
        <RhfCheckbox name='accepted' label='I accept' isSummary />
      </Harness>
    );
    expect(screen.getByText('No')).toBeInTheDocument();
  });
});
