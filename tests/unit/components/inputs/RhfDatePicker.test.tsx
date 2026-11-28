import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import RhfDatePicker from '@/components/Inputs/RhfDatePicker';
import type { CustomDatePickerProps } from '@/components/Inputs/DatePicker/types';
import { parseDateOnlyInput } from '@/utils/dateOnly';
import { FieldHarness, createFormHandle } from './rhfTestHarness';
import type { FormHandle } from './rhfTestHarness';

vi.mock(
  import('@/components/Inputs/DatePicker/CustomDatePicker'),
  () =>
    ({
      default: ({
        currentDate,
        dateOnBlur,
        dateOnChange,
        errorMessage,
        hasError,
        label,
        name,
        placeholder,
      }: CustomDatePickerProps) => (
        <div>
          <label htmlFor={name}>{label}</label>
          <input
            id={name}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={hasError ? `${name}-error` : undefined}
            placeholder={placeholder}
            defaultValue={currentDate ? currentDate.toISOString() : ''}
            onBlur={dateOnBlur}
          />
          {hasError ? <div id={`${name}-error`}>{errorMessage}</div> : null}
          <button
            type='button'
            onClick={() => void dateOnChange(new Date(2026, 5, 12))}
          >
            Pick date object
          </button>
          <button
            type='button'
            onClick={() => void dateOnChange('2026-07-13T00:00:00+10:00')}
          >
            Pick valid string
          </button>
          <button type='button' onClick={() => void dateOnChange('not a date')}>
            Pick invalid string
          </button>
          <button
            type='button'
            onClick={() => void dateOnChange(new Date(Number.NaN))}
          >
            Pick invalid date object
          </button>
          <button type='button' onClick={() => void dateOnChange(null)}>
            Clear date
          </button>
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule35>,
);

interface Values {
  dueDate: unknown;
}

const failingResolver: Resolver<Values> = () => ({
  values: {},
  errors: { dueDate: { type: 'validation', message: 'Enter a valid date' } },
});

const TouchedProbe = () => {
  const {
    formState: { touchedFields },
  } = useFormContext();
  return <output data-testid='touched'>{JSON.stringify(touchedFields)}</output>;
};

const renderPicker = (
  defaultValue: unknown,
  props: Partial<React.ComponentProps<typeof RhfDatePicker>> = {},
  resolver?: Resolver<Values>,
  form?: FormHandle<Values>,
) =>
  render(
    <FieldHarness<Values>
      field='dueDate'
      defaultValue={defaultValue}
      resolver={resolver}
      form={form}
    >
      <RhfDatePicker
        name='dueDate'
        label='Due date'
        placeholder='dd/mm/yyyy'
        {...props}
      />
      <TouchedProbe />
    </FieldHarness>,
  );

const expectValue = async (text: string) => {
  await waitFor(() => {
    expect(screen.getByTestId('value')).toHaveTextContent(text);
  });
};

describe('rhf date picker', () => {
  it('parses the initial value and stores normalised date strings from picks', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderPicker('2026-06-11T00:00:00+10:00');

    const input = screen.getByLabelText('Due date');

    expect(parseDateOnlyInput((input as HTMLInputElement).value)).toBe(
      '2026-06-11',
    );
    expect(input).toHaveAttribute('placeholder', 'dd/mm/yyyy');

    await user.click(screen.getByRole('button', { name: 'Pick date object' }));
    await expectValue('"2026-06-12T00:00:00+00:00"');

    await user.click(screen.getByRole('button', { name: 'Pick valid string' }));
    await expectValue('"2026-07-13T00:00:00+00:00"');
  });

  it('defaults the placeholder to dd/mm/yyyy', () => {
    expect.hasAssertions();

    render(
      <FieldHarness field='dueDate' defaultValue=''>
        <RhfDatePicker name='dueDate' label='Due date' />
      </FieldHarness>,
    );

    expect(screen.getByLabelText('Due date')).toHaveAttribute(
      'placeholder',
      'dd/mm/yyyy',
    );
  });

  it('keeps unparseable strings and clears invalid dates to null', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderPicker('2026-06-11T00:00:00+10:00');

    await user.click(
      screen.getByRole('button', { name: 'Pick invalid string' }),
    );
    await expectValue('"not a date"');

    await user.click(
      screen.getByRole('button', { name: 'Pick invalid date object' }),
    );
    await expectValue('null');

    await user.click(screen.getByRole('button', { name: 'Pick date object' }));
    await user.click(screen.getByRole('button', { name: 'Clear date' }));
    await expectValue('null');
  });

  it('normalises a changed blur value and marks the field touched', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderPicker('2026-06-11T00:00:00+10:00');

    const input = screen.getByLabelText('Due date');
    await user.clear(input);
    await user.type(input, '2026-08-14T00:00:00+10:00');
    await user.tab();

    await expectValue('"2026-08-14T00:00:00+00:00"');
    await waitFor(() => {
      expect(screen.getByTestId('touched')).toHaveTextContent('"dueDate":true');
    });
  });

  it('leaves an unchanged empty value alone on blur but still touches it', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderPicker('');

    await user.click(screen.getByLabelText('Due date'));
    await user.tab();

    await expectValue('""');
    await waitFor(() => {
      expect(screen.getByTestId('touched')).toHaveTextContent('"dueDate":true');
    });
  });

  it('turns a cleared non-empty date into null on blur', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderPicker('2026-06-11T00:00:00+10:00');

    await user.clear(screen.getByLabelText('Due date'));
    await user.tab();

    await expectValue('null');
  });

  it('keeps an unparseable initial value unparsed', () => {
    expect.hasAssertions();

    renderPicker('not a date');

    expect(screen.getByLabelText('Due date')).toHaveValue('');
    expect(screen.getByTestId('value')).toHaveTextContent('"not a date"');
  });

  it('shows the validation message only after the field is touched', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const form = createFormHandle<Values>();
    renderPicker('2026-06-11T00:00:00+10:00', {}, failingResolver, form);
    await form.trigger();

    expect(screen.getByLabelText('Due date')).not.toHaveAttribute(
      'aria-invalid',
    );

    await user.click(screen.getByLabelText('Due date'));
    await user.tab();

    const input = await screen.findByLabelText('Due date');
    await waitFor(() => {
      expect(input).toHaveAccessibleDescription('Enter a valid date');
    });

    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders summary values for string, Date and empty inputs', () => {
    expect.hasAssertions();

    const { unmount } = renderPicker('2026-06-11T00:00:00+10:00', {
      isSummary: true,
    });

    expect(screen.getByText('Due date')).toBeInTheDocument();
    expect(screen.getByText('11 Jun 2026')).toBeInTheDocument();

    unmount();

    const second = renderPicker(new Date('2026-06-12T00:00:00.000Z'), {
      isSummary: true,
    });

    expect(screen.getByText('12 Jun 2026')).toBeInTheDocument();

    second.unmount();

    renderPicker('', { isSummary: true });

    expect(screen.getByText('No details added')).toBeInTheDocument();
  });

  it('shows an unparseable summary value as entered', () => {
    expect.hasAssertions();

    renderPicker('not a date', { isSummary: true });

    expect(screen.getByText('not a date')).toBeInTheDocument();
  });
});
