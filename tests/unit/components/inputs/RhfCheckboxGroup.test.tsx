import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Resolver } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import RhfCheckboxGroup from '@/components/Inputs/RhfCheckboxGroup';
import { FieldHarness, createFormHandle } from './rhfTestHarness';
import type { FormHandle } from './rhfTestHarness';

interface Values {
  methods: string[] | undefined;
}

const options = [
  { value: 'email', label: 'Email', id: 'm-email', descriptor: 'By email' },
  { value: 'sms', label: 'SMS', id: 'm-sms' },
  { value: 'post', label: 'Post' },
];

const Harness = ({
  defaultValue = [],
  resolver,
  form,
  children,
}: Readonly<{
  defaultValue?: string[] | undefined;
  resolver?: Resolver<Values>;
  form?: FormHandle<Values>;
  children: ReactNode;
}>) => (
  <FieldHarness<Values>
    field='methods'
    defaultValue={defaultValue}
    resolver={resolver}
    form={form}
  >
    {children}
  </FieldHarness>
);

const failingResolver: Resolver<Values> = () => ({
  values: {},
  errors: { methods: { type: 'validation', message: 'Choose a method' } },
});

describe('rhf checkbox group behavior', () => {
  it('renders a fieldset with legend, options and prefilled selection', () => {
    expect.hasAssertions();

    render(
      <Harness defaultValue={['sms']}>
        <RhfCheckboxGroup
          name='methods'
          legend='Methods'
          options={options}
          inlineHelp='Pick any'
        />
      </Harness>,
    );

    expect(screen.getByTestId('fs-methods')).toHaveAccessibleName('Methods');
    expect(screen.getByLabelText(/Email/)).not.toBeChecked();
    expect(screen.getByLabelText('SMS')).toBeChecked();
    expect(screen.getByText('By email')).toBeInTheDocument();
  });

  it('wires the inline help and falls back to a name based id for options without one', () => {
    expect.hasAssertions();

    render(
      <Harness defaultValue={['sms']}>
        <RhfCheckboxGroup
          name='methods'
          legend='Methods'
          options={options}
          inlineHelp='Pick any'
        />
      </Harness>,
    );

    expect(screen.getByText('Pick any')).toHaveAttribute('id', 'help-methods');
    // option without an id falls back to a name based id
    expect(screen.getByLabelText('Post')).toHaveAttribute('id', 'methods-2');
  });

  it('adds values in tick order and removes them when unticked, notifying onChange', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const onChange = vi.fn<(selected: string[]) => void>();
    render(
      <Harness>
        <RhfCheckboxGroup
          name='methods'
          legend='Methods'
          options={options}
          onChange={onChange}
        />
      </Harness>,
    );

    await user.click(screen.getByLabelText('SMS'));
    await user.click(screen.getByLabelText(/Email/));

    expect(screen.getByTestId('value')).toHaveTextContent('["sms","email"]');
    expect(onChange).toHaveBeenLastCalledWith(['sms', 'email']);

    await user.click(screen.getByLabelText('SMS'));

    expect(screen.getByTestId('value')).toHaveTextContent('["email"]');
    expect(onChange).toHaveBeenLastCalledWith(['email']);
  });

  it('treats a missing value as an empty selection', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    render(
      <Harness defaultValue={undefined}>
        <RhfCheckboxGroup name='methods' legend='Methods' options={options} />
      </Harness>,
    );

    expect(screen.getByLabelText('SMS')).not.toBeChecked();

    await user.click(screen.getByLabelText('SMS'));

    expect(screen.getByTestId('value')).toHaveTextContent('["sms"]');
  });

  it('shows the group validation message after submit and describes the fieldset', async () => {
    expect.hasAssertions();

    const form = createFormHandle<Values>();
    render(
      <Harness resolver={failingResolver} form={form}>
        <RhfCheckboxGroup
          name='methods'
          legend='Methods'
          options={options}
          inlineHelp='Pick any'
        />
      </Harness>,
    );

    expect(screen.queryByText('Choose a method')).not.toBeInTheDocument();

    await form.submit();

    expect(screen.getByText('Choose a method')).toHaveClass(
      'form-validation-message',
    );
    expect(screen.getByTestId('fs-methods')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByTestId('fs-methods')).toHaveAttribute(
      'aria-describedby',
      'help-methods methods-validation-msg',
    );
  });

  it('shows the message once touched by blurring an option', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const form = createFormHandle<Values>();
    render(
      <Harness resolver={failingResolver} form={form}>
        <RhfCheckboxGroup name='methods' legend='Methods' options={options} />
      </Harness>,
    );

    await user.click(screen.getByLabelText('SMS'));
    await user.tab();
    await form.trigger();

    expect(screen.getByText('Choose a method')).toBeInTheDocument();
  });

  it('suppresses the group message when asked', async () => {
    expect.hasAssertions();

    const form = createFormHandle<Values>();
    render(
      <Harness resolver={failingResolver} form={form}>
        <RhfCheckboxGroup
          name='methods'
          legend='Methods'
          options={options}
          supressFieldLevelMessages
        />
      </Harness>,
    );

    await form.submit();

    expect(screen.queryByText('Choose a method')).not.toBeInTheDocument();
  });

  it('supports horizontal layout, titled help, class names and disabled options', () => {
    expect.hasAssertions();

    render(
      <Harness>
        <RhfCheckboxGroup
          name='methods'
          legend='Methods'
          displayHorizontally
          inlineHelp='Details'
          inlineHelpTitle='What is this?'
          containerClassName='box'
          legendClassName='visually-hidden'
          className='checkbox-sm'
          options={[{ value: 'a', label: 'A', disabled: true }]}
        />
      </Harness>,
    );

    expect(screen.getByLabelText('A')).toBeDisabled();
    expect(screen.getByText('Methods')).toHaveClass('visually-hidden');
    expect(screen.getByText('What is this?')).toBeInTheDocument();
    expect(document.querySelector('.checkbox.checkbox-sm')).not.toBeNull();
    expect(document.querySelector('.row .col')).not.toBeNull();
  });

  it('renders nothing in summary mode, as the earlier group did for array values', () => {
    expect.hasAssertions();

    const { container } = render(
      <Harness defaultValue={['sms']}>
        <RhfCheckboxGroup
          name='methods'
          legend='Methods'
          options={options}
          isSummary
        />
      </Harness>,
    );

    expect(container.querySelector('fieldset')).toBeNull();
  });

  it('treats a stored value that is not a list as nothing selected and starts a list on tick', async () => {
    expect.hasAssertions();

    render(
      <Harness defaultValue={'sms' as unknown as string[]}>
        <RhfCheckboxGroup name='methods' legend='Methods' options={options} />
      </Harness>,
    );

    expect(screen.getByRole('checkbox', { name: 'SMS' })).not.toBeChecked();

    await userEvent
      .setup()
      .click(screen.getByRole('checkbox', { name: 'Post' }));

    expect(screen.getByTestId('value')).toHaveTextContent('["post"]');
  });
});
