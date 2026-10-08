import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import RhfRadioButtonGroup from '@/components/Inputs/RhfRadioButtonGroup';

const options = [
  { label: 'All', value: 'all', id: 'opt-all' },
  { label: 'Open', value: 'open', id: 'opt-open' },
];

interface Values {
  status: string | boolean;
}

const ValueProbe = () => {
  const { watch } = useFormContext<Values>();
  return <output data-testid='value'>{String(watch('status'))}</output>;
};

const Harness = ({
  defaultValue = 'all',
  children,
}: Readonly<{ defaultValue?: string | boolean; children: ReactNode }>) => {
  const methods = useForm<Values>({ defaultValues: { status: defaultValue } });
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
      <ValueProbe />
    </FormProvider>
  );
};

describe('RhfRadioButtonGroup', () => {
  it('checks the option matching the form value', () => {
    render(
      <Harness defaultValue='open'>
        <RhfRadioButtonGroup name='status' legend='Status' options={options} />
      </Harness>
    );

    expect(screen.getByLabelText('Open')).toBeChecked();
    expect(screen.getByLabelText('All')).not.toBeChecked();
  });

  it('updates the form value and calls onChange when an option is chosen', async () => {
    const onChange = vi.fn();
    render(
      <Harness>
        <RhfRadioButtonGroup
          name='status'
          legend='Status'
          options={options}
          onChange={onChange}
        />
      </Harness>
    );

    await userEvent.click(screen.getByLabelText('Open'));

    expect(screen.getByTestId('value')).toHaveTextContent('open');
    expect(screen.getByLabelText('Open')).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('keeps the typed value of boolean options', async () => {
    render(
      <Harness defaultValue={false}>
        <RhfRadioButtonGroup
          name='status'
          legend='Agree'
          options={[
            { label: 'Yes', value: true, id: 'agree-yes' },
            { label: 'No', value: false, id: 'agree-no' },
          ]}
        />
      </Harness>
    );

    expect(screen.getByLabelText('No')).toBeChecked();

    await userEvent.click(screen.getByLabelText('Yes'));

    expect(screen.getByLabelText('Yes')).toBeChecked();
    expect(screen.getByTestId('value')).toHaveTextContent('true');
  });

  it('disables every option when the group is disabled', () => {
    render(
      <Harness>
        <RhfRadioButtonGroup
          name='status'
          legend='Status'
          options={options}
          disabled
        />
      </Harness>
    );

    expect(screen.getByLabelText('All')).toBeDisabled();
    expect(screen.getByLabelText('Open')).toBeDisabled();
  });

  it('links the help text to the fieldset for assistive technology', () => {
    render(
      <Harness>
        <RhfRadioButtonGroup
          name='status'
          id='q-status'
          legend='Status'
          inlineHelp='Pick one'
          options={options}
        />
      </Harness>
    );

    expect(screen.getByText('Pick one')).toHaveAttribute('id', 'help-q-status');
    expect(screen.getByTestId('fs-q-status')).toHaveAttribute(
      'aria-describedby',
      'help-q-status'
    );
  });

  it('shows the validation message only after the group has been touched', async () => {
    const Invalid = () => {
      const methods = useForm<Values>({ defaultValues: { status: '' } });
      return (
        <FormProvider {...methods}>
          <button type='button' onClick={() => void methods.trigger()}>
            validate
          </button>
          <RhfRadioButtonGroup
            name='status'
            id='q-status'
            legend='Status'
            options={options}
            rules={{ required: 'Choose a status' }}
          />
        </FormProvider>
      );
    };
    render(<Invalid />);

    await userEvent.click(screen.getByText('validate'));
    expect(screen.queryByText('Choose a status')).not.toBeInTheDocument();

    // Tab into the group, then out of it, to blur without choosing an option.
    await userEvent.tab();
    expect(screen.getByLabelText('All')).toHaveFocus();
    await userEvent.tab();

    expect(await screen.findByText('Choose a status')).toHaveAttribute(
      'id',
      'q-status-validation-msg'
    );
    expect(screen.getByTestId('fs-q-status')).toHaveAttribute(
      'aria-describedby',
      'q-status-validation-msg'
    );
  });

  it('renders the selected label as a summary when isSummary is set', () => {
    render(
      <Harness defaultValue='open'>
        <RhfRadioButtonGroup
          name='status'
          legend='Status'
          options={options}
          isSummary
        />
      </Harness>
    );

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('renders nothing in summary mode when no value is selected', () => {
    render(
      <Harness defaultValue=''>
        <RhfRadioButtonGroup
          name='status'
          legend='Status'
          options={options}
          isSummary
        />
      </Harness>
    );

    expect(screen.queryByText('Status')).not.toBeInTheDocument();
  });

  it('renders descriptors and linked sub-fields beside their option', () => {
    render(
      <Harness>
        <RhfRadioButtonGroup
          name='status'
          legend='Status'
          options={[
            {
              label: 'All',
              value: 'all',
              id: 'opt-all',
              descriptor: 'Every status',
              subFormField: <p>All sub-field</p>,
            },
            { label: 'Open', value: 'open', id: 'opt-open' },
          ]}
        />
      </Harness>
    );

    expect(screen.getByText('Every status')).toBeInTheDocument();
    expect(screen.getByText('All sub-field')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^All/ })).toHaveAttribute(
      'aria-controls',
      'opt-all-sub-field'
    );
    expect(screen.getByLabelText('Open')).not.toHaveAttribute('aria-controls');
  });

  it('lays options out horizontally when requested', () => {
    render(
      <Harness>
        <RhfRadioButtonGroup
          name='status'
          legend='Status'
          options={options}
          displayHorizontally
        />
      </Harness>
    );

    expect(screen.getByLabelText('All').closest('.row')).not.toBeNull();
    expect(screen.getByLabelText('Open').closest('.row')).not.toBeNull();
  });

  it('puts titled help inside a details control', () => {
    render(
      <Harness>
        <RhfRadioButtonGroup
          name='status'
          id='q-status'
          legend='Status'
          inlineHelp='Longer guidance'
          inlineHelpTitle='Need help?'
          options={options}
        />
      </Harness>
    );

    expect(screen.getByText('Need help?')).toBeInTheDocument();
  });

  it('falls back to a placeholder when the summary value matches no option', () => {
    render(
      <Harness defaultValue='archived'>
        <RhfRadioButtonGroup
          name='status'
          legend='Status'
          options={options}
          isSummary
        />
      </Harness>
    );

    expect(screen.getByText('No details added')).toBeInTheDocument();
  });

  it('leaves every option unchecked when the form has no value yet', () => {
    const Empty = () => {
      const methods = useForm<Partial<Values>>();
      return (
        <FormProvider {...methods}>
          <RhfRadioButtonGroup
            name='status'
            legend='Status'
            options={options}
          />
        </FormProvider>
      );
    };
    render(<Empty />);

    expect(screen.getByLabelText('All')).not.toBeChecked();
    expect(screen.getByLabelText('Open')).not.toBeChecked();
  });

  it('shows the validation message after a submit attempt without touching the group', async () => {
    const Submittable = () => {
      const methods = useForm<Values>({ defaultValues: { status: '' } });
      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(() => undefined)}>
            <RhfRadioButtonGroup
              name='status'
              id='q-status'
              legend='Status'
              options={options}
              rules={{ required: 'Choose a status' }}
            />
            <button type='submit'>submit</button>
          </form>
        </FormProvider>
      );
    };
    render(<Submittable />);

    await userEvent.click(screen.getByText('submit'));

    expect(await screen.findByText('Choose a status')).toBeInTheDocument();
    expect(screen.getByTestId('fs-q-status')).toHaveAttribute(
      'aria-describedby',
      'q-status-validation-msg'
    );
  });
});
