import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { useField } from '@/components/forms/FormikForm/rhfCompat';

interface FormValues {
  email: string;
}

function TestField(): JSX.Element {
  const [field, meta, helpers] = useField('email');

  return (
    <div>
      <input
        data-testid='email-input'
        name={field.name}
        value={field.value as string}
        onChange={field.onChange}
        onBlur={field.onBlur}
      />
      <span data-testid='touched'>{String(meta.touched)}</span>
      <span data-testid='error'>{meta.error ?? ''}</span>
      <button
        type='button'
        data-testid='set-value'
        onClick={() => helpers.setValue('set-by-helper')}
      >
        setValue
      </button>
      <button
        type='button'
        data-testid='set-touched'
        onClick={() => helpers.setTouched(true)}
      >
        setTouched
      </button>
    </div>
  );
}

function Harness({
  onReport,
}: {
  onReport: (values: FormValues) => void;
}): JSX.Element {
  const methods = useForm<FormValues>({ defaultValues: { email: '' } });
  const { getValues, formState } = methods;

  return (
    <FormProvider {...methods}>
      <TestField />
      <button
        type='button'
        data-testid='report'
        onClick={() => onReport(getValues())}
      >
        report
      </button>
      <span data-testid='is-touched-form'>
        {String(formState.touchedFields.email ?? false)}
      </span>
    </FormProvider>
  );
}

describe('rhfCompat useField', () => {
  it('returns a 3-tuple shape matching Formik useField', () => {
    render(<Harness onReport={vi.fn()} />);

    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('touched')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('');
  });

  it('updates the form value when helpers.setValue is called', async () => {
    const onReport = vi.fn();
    render(<Harness onReport={onReport} />);

    await userEvent.click(screen.getByTestId('set-value'));
    await userEvent.click(screen.getByTestId('report'));

    expect(onReport).toHaveBeenCalledWith({ email: 'set-by-helper' });
  });

  it('marks the field touched in form state when helpers.setTouched is called', async () => {
    render(<Harness onReport={vi.fn()} />);

    expect(screen.getByTestId('is-touched-form')).toHaveTextContent('false');

    await userEvent.click(screen.getByTestId('set-touched'));

    expect(screen.getByTestId('is-touched-form')).toHaveTextContent('true');
  });

  it('reflects raw onChange DOM events into the form value', async () => {
    const onReport = vi.fn();
    render(<Harness onReport={onReport} />);

    await userEvent.type(screen.getByTestId('email-input'), 'a@b.com');
    await userEvent.click(screen.getByTestId('report'));

    expect(onReport).toHaveBeenCalledWith({ email: 'a@b.com' });
  });
});
