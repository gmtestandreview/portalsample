import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import CustomDatePicker from '@/components/Inputs/DatePicker/CustomDatePicker';

const mockDate = new Date('2026-05-18T00:00:00.000Z');

type MockDatePickerKeyboardEvent = Pick<
  React.KeyboardEvent,
  'key' | 'preventDefault'
>;

type MockDatePickerFocusEvent = Pick<React.FocusEvent, 'type'>;

interface MockDatePickerProps {
  customInput: React.ReactElement;
  disabled?: boolean;
  highlightDates?: Date[];
  onBlur?: (event: MockDatePickerFocusEvent) => void;
  onChange: (date: Date | null) => void;
  onClickOutside: () => void;
  onKeyDown?: (event: MockDatePickerKeyboardEvent) => void;
  open?: boolean;
  openToDate?: Date | null;
  popperModifiers: {
    options: {
      offset: (args: { placement: string }) => [number, number];
    };
  }[];
  readOnly?: boolean;
  selected?: Date | null;
  children?: React.ReactNode;
}

type MockDatePickerRef = { state: { open: boolean } } | Record<string, never>;
type MockDatePickerShape = 'with-open-state' | 'without-open-state';

const mockDatePickerRef = vi.hoisted((): { shape: MockDatePickerShape } => ({
  shape: 'with-open-state',
}));

// The real input only renders its feedback and inline-help elements when it has
// something to show, so their refs can be unattached while the popper measures.
const mockInputHelpRefs = vi.hoisted(() => ({ attached: true }));

const expectDatePickerOffsetsAfterReopen = (nextDate: Date) => {
  expect(screen.getByTestId('bottom-offset')).toHaveTextContent('-49');
  expect(screen.getByTestId('top-offset')).toHaveTextContent('-45');
  expect(screen.getByTestId('selected-date')).toHaveTextContent(
    nextDate.toISOString(),
  );
};

vi.mock(
  import('@/components/Inputs/DatePicker/CustomDateInput'),
  (() =>
    ({
      default: ({
        calendarOnKeyDown,
        forwardedControlRef,
        forwardedFeedbackRef,
        forwardedInlineHelpRef,
        handleEnsureCalendarClosed,
        handleOpenCalendar,
        handleCloseCalendar,
        hasError,
        label,
        onBlur,
        onKeyDown,
      }: {
        calendarOnKeyDown: (event: React.KeyboardEvent) => void;
        forwardedControlRef: React.Ref<HTMLInputElement>;
        forwardedFeedbackRef: React.Ref<HTMLDivElement>;
        forwardedInlineHelpRef: React.Ref<HTMLDivElement>;
        handleEnsureCalendarClosed: () => void;
        handleOpenCalendar: () => void;
        handleCloseCalendar: () => void;
        hasError?: boolean;
        label?: string;
        onBlur?: (event: React.FocusEvent) => void;
        onKeyDown?: (event: React.KeyboardEvent) => void;
      }) => (
        <div>
          <input
            aria-label='Date input'
            className={hasError ? 'is-invalid' : ''}
            ref={forwardedControlRef}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            required
          />
          <div
            ref={mockInputHelpRefs.attached ? forwardedInlineHelpRef : null}
            data-testid='inline-help-ref'
          />
          <div
            ref={mockInputHelpRefs.attached ? forwardedFeedbackRef : null}
            data-testid='feedback-ref'
          />
          <button type='button' onClick={handleOpenCalendar}>
            Open calendar
          </button>
          <button type='button' onClick={handleCloseCalendar}>
            Close trigger
          </button>
          <button type='button' onClick={handleEnsureCalendarClosed}>
            Ensure closed
          </button>
          <button type='button' onKeyDown={calendarOnKeyDown}>
            Calendar key target
          </button>
          {label ? <span>{label}</span> : null}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule33>) as unknown as __DynamicPartialMockFactory<__TestMockModule33>,
);

vi.mock(import('react-datepicker'), (() => {
  const MockDatePicker = React.forwardRef<
    MockDatePickerRef,
    MockDatePickerProps
  >((props, ref) => {
    const offsetFor = (placement: string) => {
      const [modifier] = props.popperModifiers;

      if (!modifier) {
        throw new Error('Expected a popper offset modifier');
      }

      return modifier.options.offset({ placement })[1];
    };

    React.useImperativeHandle(ref, () =>
      mockDatePickerRef.shape === 'with-open-state'
        ? {
            state: {
              open: false,
            },
          }
        : {},
    );

    return (
      <div data-testid='mock-datepicker'>
        <output data-testid='highlight-date'>
          {props.highlightDates?.[0]?.toISOString() ?? ''}
        </output>
        {React.cloneElement(props.customInput, {
          disabled: props.disabled,
          onBlur: props.onBlur,
          onKeyDown: props.onKeyDown,
          readOnly: props.readOnly,
        })}
        <button
          type='button'
          onClick={() =>
            props.onKeyDown?.({
              key: 'Enter',
              preventDefault: vi.fn<() => void>(),
            })
          }
        >
          Input Enter trigger
        </button>
        <button
          type='button'
          onClick={() =>
            props.onKeyDown?.({ key: ' ', preventDefault: vi.fn<() => void>() })
          }
        >
          Input Space trigger
        </button>
        {props.open ? (
          <div>
            <button
              type='button'
              onClick={() => {
                props.onChange(mockDate);
              }}
            >
              Pick date
            </button>
            <button
              type='button'
              onClick={() =>
                props.onKeyDown?.({
                  key: 'Escape',
                  preventDefault: vi.fn<() => void>(),
                })
              }
            >
              Escape
            </button>
            <button
              type='button'
              onClick={() => {
                props.onClickOutside();
              }}
            >
              Click outside
            </button>
            <button
              type='button'
              onClick={() => props.onBlur?.({ type: 'blur' })}
            >
              Blur picker
            </button>
            <button
              type='button'
              onClick={() =>
                props.onKeyDown?.({
                  key: 'Enter',
                  preventDefault: vi.fn<() => void>(),
                })
              }
            >
              Enter key
            </button>
            <button
              type='button'
              onClick={() =>
                props.onKeyDown?.({
                  key: ' ',
                  preventDefault: vi.fn<() => void>(),
                })
              }
            >
              Space key
            </button>
            <button
              type='button'
              onClick={() =>
                props.onKeyDown?.({
                  key: 'Other',
                  preventDefault: vi.fn<() => void>(),
                })
              }
            >
              Other key
            </button>
            <output data-testid='selected-date'>
              {props.selected?.toISOString() ?? ''}
            </output>
            <output data-testid='open-date'>
              {props.openToDate?.toISOString() ?? ''}
            </output>
            <output data-testid='bottom-offset'>
              {String(offsetFor('bottom-start'))}
            </output>
            <output data-testid='top-offset'>
              {String(offsetFor('top-start'))}
            </output>
            <output data-testid='side-offset'>
              {String(offsetFor('right-start'))}
            </output>
            {props.children}
          </div>
        ) : null}
      </div>
    );
  });

  MockDatePicker.displayName = 'MockDatePicker';

  return {
    default: MockDatePicker,
  } satisfies __ExactMockModule<__TestMockModule34>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule34>);

describe('custom date picker', () => {
  it('opens, selects a date, and closes the calendar', async () => {
    expect.hasAssertions();

    const dateOnChange = vi.fn<() => void>();
    const dateOnBlur = vi.fn<() => void>();

    render(
      <CustomDatePicker
        calendarButtonTitle='Date'
        dateOnBlur={dateOnBlur}
        dateOnChange={dateOnChange}
        name='testDate'
        label='Pick a date'
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Open calendar' }),
    );

    expect(
      screen.getByRole('button', { name: 'Pick date' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pick date' }));

    expect(dateOnChange).toHaveBeenCalledWith(mockDate);
    expect(
      screen.queryByRole('button', { name: 'Pick date' }),
    ).not.toBeInTheDocument();
  });

  it('supports an omitted calendar button title', () => {
    expect.hasAssertions();

    render(
      <CustomDatePicker
        dateOnBlur={vi.fn<() => void>()}
        dateOnChange={vi.fn<() => void>()}
        name='untitledDate'
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Open calendar' }),
    ).toBeInTheDocument();
  });

  it('initializes the wrapper id and today values once across rerenders', async () => {
    expect.hasAssertions();

    const randomUUID = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-4000-8000-000000000000');
    const user = userEvent.setup();

    try {
      const { rerender } = render(
        <CustomDatePicker
          calendarButtonTitle='Date'
          dateOnBlur={vi.fn<() => void>()}
          dateOnChange={vi.fn<() => void>()}
          name='stableDate'
        />,
      );

      const initialWrapper =
        screen.getByTestId('mock-datepicker').parentElement;
      if (!initialWrapper) {
        throw new Error('Expected the date picker wrapper to be rendered');
      }

      await user.click(screen.getByRole('button', { name: 'Open calendar' }));

      const initialToday = screen.getByTestId('highlight-date').textContent;
      const initialOpenDate = screen.getByTestId('open-date').textContent;

      rerender(
        <CustomDatePicker
          calendarButtonTitle='Date'
          dateOnBlur={vi.fn<() => void>()}
          dateOnChange={vi.fn<() => void>()}
          name='stableDate'
        />,
      );

      expect(randomUUID).toHaveBeenCalledTimes(1);
      expect(initialWrapper).toHaveAttribute(
        'id',
        '00000000-0000-4000-8000-000000000000',
      );
      expect(screen.getByTestId('mock-datepicker').parentElement).toBe(
        initialWrapper,
      );
      expect(screen.getByTestId('highlight-date')).toHaveTextContent(
        initialToday,
      );
      expect(screen.getByTestId('open-date')).toHaveTextContent(
        initialOpenDate,
      );
    } finally {
      randomUUID.mockRestore();
    }
  });

  it('supports the Today action through the current open/close flow', async () => {
    expect.hasAssertions();

    const dateOnChange = vi.fn<() => void>();

    render(
      <CustomDatePicker
        calendarButtonTitle='Date'
        dateOnBlur={vi.fn<() => void>()}
        dateOnChange={dateOnChange}
        name='todayDate'
        label='Pick a date'
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Open calendar' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: "Select today's date" }),
    );

    expect(dateOnChange).toHaveBeenCalledWith(expect.any(Date));
    expect(
      screen.queryByRole('button', { name: 'Pick date' }),
    ).not.toBeInTheDocument();
  });

  it('handles blur, outside click, escape, and calendar keyboard controls', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const dateOnBlur = vi.fn<() => void>();

    render(
      <CustomDatePicker
        calendarButtonTitle='Date'
        dateOnBlur={dateOnBlur}
        dateOnChange={vi.fn<() => void>()}
        name='keyboardDate'
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    await user.click(screen.getByRole('button', { name: 'Blur picker' }));

    expect(dateOnBlur).toHaveBeenCalledWith({ type: 'blur' });

    await user.click(screen.getByRole('button', { name: 'Other key' }));

    expect(
      screen.getByRole('button', { name: 'Pick date' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Escape' }));

    expect(
      screen.queryByRole('button', { name: 'Pick date' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    await user.click(screen.getByRole('button', { name: 'Click outside' }));

    expect(
      screen.queryByRole('button', { name: 'Pick date' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    screen.getByRole('button', { name: 'Calendar key target' }).focus();
    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('button', { name: 'Pick date' }),
    ).not.toBeInTheDocument();
  });

  it('opens from Enter and Space unless read-only, while disabled read-only follows the component condition', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const { rerender } = render(
      <CustomDatePicker
        calendarButtonTitle='Date'
        dateOnBlur={vi.fn<() => void>()}
        dateOnChange={vi.fn<() => void>()}
        name='inputKeyboardDate'
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Input Enter trigger' }),
    );

    expect(
      screen.getByRole('button', { name: 'Pick date' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close calendar' }));

    await user.click(
      screen.getByRole('button', { name: 'Input Space trigger' }),
    );

    expect(
      screen.getByRole('button', { name: 'Pick date' }),
    ).toBeInTheDocument();

    rerender(
      <CustomDatePicker
        calendarButtonTitle='Date'
        dateOnBlur={vi.fn<() => void>()}
        dateOnChange={vi.fn<() => void>()}
        name='inputKeyboardDate'
        readOnly
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Close calendar' }));
    await user.click(
      screen.getByRole('button', { name: 'Input Enter trigger' }),
    );

    expect(
      screen.queryByRole('button', { name: 'Pick date' }),
    ).not.toBeInTheDocument();

    rerender(
      <CustomDatePicker
        calendarButtonTitle='Date'
        dateOnBlur={vi.fn<() => void>()}
        dateOnChange={vi.fn<() => void>()}
        disabled
        name='inputKeyboardDate'
        readOnly
      />,
    );
    await user.click(
      screen.getByRole('button', { name: 'Input Enter trigger' }),
    );

    expect(
      screen.getByRole('button', { name: 'Pick date' }),
    ).toBeInTheDocument();
  });

  it('tolerates a date-picker ref without open state', async () => {
    expect.hasAssertions();

    mockDatePickerRef.shape = 'without-open-state';
    const user = userEvent.setup();

    try {
      render(
        <CustomDatePicker
          calendarButtonTitle='Date'
          dateOnBlur={vi.fn<() => void>()}
          dateOnChange={vi.fn<() => void>()}
          name='invalidRefDate'
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Open calendar' }));
      await user.click(screen.getByRole('button', { name: 'Ensure closed' }));

      expect(
        screen.getByRole('button', { name: 'Pick date' }),
      ).toBeInTheDocument();
    } finally {
      mockDatePickerRef.shape = 'with-open-state';
    }
  });

  it('measures the offsets as zero-height when the help and feedback elements are not rendered', async () => {
    expect.hasAssertions();

    mockInputHelpRefs.attached = false;

    try {
      const user = userEvent.setup();
      render(
        <CustomDatePicker
          calendarButtonTitle='Date'
          currentDate={new Date('2026-06-01T00:00:00.000Z')}
          dateOnBlur={vi.fn<() => void>()}
          dateOnChange={vi.fn<() => void>()}
          hasError
          name='unmeasuredDate'
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Open calendar' }));

      expect(screen.getByTestId('bottom-offset')).toHaveTextContent('-53');
      expect(screen.getByTestId('top-offset')).toHaveTextContent('-48');
    } finally {
      mockInputHelpRefs.attached = true;
    }
  });

  it('synchronizes current dates and calculates bottom, top, and neutral offsets', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const currentDate = new Date('2026-06-01T00:00:00.000Z');
    const nextDate = new Date('2026-06-02T00:00:00.000Z');
    const { rerender } = render(
      <CustomDatePicker
        calendarButtonTitle='Date'
        currentDate={currentDate}
        dateOnBlur={vi.fn<() => void>()}
        dateOnChange={vi.fn<() => void>()}
        hasError
        inlineHelp='Date help'
        name='offsetDate'
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));

    expect(screen.getByTestId('selected-date')).toHaveTextContent(
      currentDate.toISOString(),
    );
    expect(screen.getByTestId('open-date')).toHaveTextContent(
      currentDate.toISOString(),
    );
    expect(screen.getByTestId('bottom-offset')).toHaveTextContent('-53');
    expect(screen.getByTestId('top-offset')).toHaveTextContent('-48');
    expect(screen.getByTestId('side-offset')).toHaveTextContent('0');

    await user.click(screen.getByRole('button', { name: 'Pick date' }));
    await user.click(screen.getByRole('button', { name: 'Open calendar' }));

    rerender(
      <CustomDatePicker
        calendarButtonTitle='Date'
        currentDate={nextDate}
        dateOnBlur={vi.fn<() => void>()}
        dateOnChange={vi.fn<() => void>()}
        name='offsetDate'
      />,
    );

    expectDatePickerOffsetsAfterReopen(nextDate);
  });
});
