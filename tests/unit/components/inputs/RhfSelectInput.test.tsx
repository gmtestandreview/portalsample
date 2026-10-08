import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import type { Resolver, UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import RhfSelectInput from '@/components/Inputs/RhfSelectInput';

const options = [
  { displayText: 'Certificate', value: 'cert' },
  { displayText: 'Manuals', value: 'manual', disabled: true },
];

interface Values {
  category: string | number;
}

let formMethods: UseFormReturn<Values> | undefined;

const ValueProbe = () => {
  const { watch } = useFormContext<Values>();
  return (
    <output data-testid='value'>{JSON.stringify(watch('category'))}</output>
  );
};

const Harness = ({
  defaultValue = '',
  resolver,
  children,
}: Readonly<{
  defaultValue?: string | number;
  resolver?: Resolver<Values>;
  children: ReactNode;
}>) => {
  const methods = useForm<Values>({
    defaultValues: { category: defaultValue },
    ...(resolver === undefined ? {} : { resolver }),
  });
  useEffect(() => {
    formMethods = methods;
  });
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
      <ValueProbe />
    </FormProvider>
  );
};

const failingResolver: Resolver<Values> = async () => ({
  values: {},
  errors: {
    category: { type: 'validation', message: 'Select a category' },
  },
});

describe('RhfSelectInput', () => {
  it('renders the label, a blank option and the given options', () => {
    render(
      <Harness>
        <RhfSelectInput
          name='category'
          label='Category'
          options={options}
          addBlank
          containerClassName='extra'
          className='form-select-sm'
        />
      </Harness>
    );

    const select = screen.getByRole('combobox', { name: 'Category' });
    expect(select).toHaveClass('form-select-sm');
    expect(screen.getByRole('option', { name: 'Please select' })).toHaveValue(
      ''
    );
    expect(screen.getByRole('option', { name: 'Manuals' })).toBeDisabled();
  });

  it('uses a custom blank label and renders no options when none are given', () => {
    render(
      <Harness>
        <RhfSelectInput
          name='category'
          label='Category'
          addBlank
          defaultDisplayText='Select'
        />
      </Harness>
    );

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Select' })).toBeInTheDocument();
  });

  it('omits the blank option unless asked for', () => {
    render(
      <Harness>
        <RhfSelectInput name='category' label='Category' options={options} />
      </Harness>
    );

    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('shows the form value and applies the id and disabled state', () => {
    render(
      <Harness defaultValue='cert'>
        <RhfSelectInput
          name='category'
          id='category-select'
          label='Category'
          options={options}
          disabled
        />
      </Harness>
    );

    const select = screen.getByRole('combobox', { name: 'Category' });
    expect(select).toHaveValue('cert');
    expect(select).toHaveAttribute('id', 'category-select');
    expect(select).toBeDisabled();
  });

  it('stores the chosen option and calls onChange with it', async () => {
    const onChange = vi.fn();
    render(
      <Harness>
        <RhfSelectInput
          name='category'
          label='Category'
          options={options}
          addBlank
          onChange={onChange}
        />
      </Harness>
    );

    await userEvent.selectOptions(screen.getByRole('combobox'), 'cert');

    expect(screen.getByTestId('value')).toHaveTextContent('"cert"');
    expect(onChange).toHaveBeenCalledWith('cert');
  });

  it('keeps the typed value of numeric options', async () => {
    render(
      <Harness>
        <RhfSelectInput<number>
          name='category'
          label='Count'
          options={[
            { displayText: 'One', value: 1 },
            { displayText: 'Two', value: 2 },
          ]}
        />
      </Harness>
    );

    await userEvent.selectOptions(screen.getByRole('combobox'), 'Two');

    expect(screen.getByTestId('value')).toHaveTextContent('2');
  });

  it('stores the blank option value when it is chosen again', async () => {
    const onChange = vi.fn();
    render(
      <Harness defaultValue='cert'>
        <RhfSelectInput
          name='category'
          label='Category'
          options={options}
          addBlank
          onChange={onChange}
        />
      </Harness>
    );

    await userEvent.selectOptions(screen.getByRole('combobox'), '');

    expect(screen.getByTestId('value')).toHaveTextContent('""');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('updates the form value without an onChange callback', async () => {
    render(
      <Harness>
        <RhfSelectInput name='category' label='Category' options={options} />
      </Harness>
    );

    await userEvent.selectOptions(screen.getByRole('combobox'), 'cert');

    expect(screen.getByTestId('value')).toHaveTextContent('"cert"');
  });

  it('treats a null form value as the blank selection', () => {
    render(
      <Harness defaultValue={null as unknown as string}>
        <RhfSelectInput
          name='category'
          label='Category'
          options={options}
          addBlank
        />
      </Harness>
    );

    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('shows the blank option for a value that matches no option', () => {
    render(
      <Harness defaultValue='cert'>
        <RhfSelectInput name='category' label='Category' addBlank />
      </Harness>
    );

    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('shows the validation message only after a submit attempt', async () => {
    render(
      <Harness resolver={failingResolver}>
        <RhfSelectInput name='category' label='Category' options={options} />
      </Harness>
    );
    const select = screen.getByRole('combobox', { name: 'Category' });
    expect(screen.queryByText('Select a category')).not.toBeInTheDocument();

    await act(async () => {
      await formMethods?.handleSubmit(() => undefined)();
    });

    expect(screen.getByText('Select a category')).toHaveAttribute(
      'id',
      'category-validation-msg'
    );
    expect(select).toHaveClass('is-invalid');
    expect(select).toHaveAttribute(
      'aria-describedby',
      'category-validation-msg'
    );
  });

  it('shows the validation message once the field has been touched', async () => {
    render(
      <Harness resolver={failingResolver}>
        <RhfSelectInput name='category' label='Category' options={options} />
        <button type='button'>Elsewhere</button>
      </Harness>
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.tab();
    await act(async () => {
      await formMethods?.trigger();
    });

    expect(screen.getByText('Select a category')).toBeInTheDocument();
  });

  it('renders a summary line for the selected option', () => {
    render(
      <Harness defaultValue='cert'>
        <RhfSelectInput
          name='category'
          label='Category'
          options={options}
          isSummary
        />
      </Harness>
    );

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Certificate')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders an empty summary value when the selection matches no option', () => {
    render(
      <Harness defaultValue='other'>
        <RhfSelectInput name='category' label='Category' isSummary />
      </Harness>
    );

    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('renders nothing in summary mode when no value is selected', () => {
    const { container } = render(
      <Harness>
        <RhfSelectInput
          name='category'
          label='Category'
          options={options}
          isSummary
        />
      </Harness>
    );

    expect(container.querySelector('form')).toBeEmptyDOMElement();
  });
});
