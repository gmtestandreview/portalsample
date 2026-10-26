import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import CustomDatePicker from '@/components/Inputs/DatePicker/CustomDatePicker';

const mockDate = new Date('2026-05-18T00:00:00.000Z');

const expectDatePickerOffsetsAfterReopen = (nextDate: Date) => {
  expect(screen.getByTestId('bottom-offset')).toHaveTextContent('-49');
  expect(screen.getByTestId('top-offset')).toHaveTextContent('-45');
  expect(screen.getByTestId('selected-date')).toHaveTextContent(
    nextDate.toISOString(),
  );
};

vi.mock(
  '@/components/Inputs/DatePicker/CustomDateInput',
  () =>
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
          <div ref={forwardedInlineHelpRef} data-testid='inline-help-ref' />
          <div ref={forwardedFeedbackRef} data-testid='feedback-ref' />
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
    }) satisfies __ExactMockModule<__TestMockModule33>,
);

vi.mock('react-datepicker', () => {
  const MockDatePicker = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      state: {
        open: false,
      },
    }));

    return (
      <div data-testid='mock-datepicker'>
        {React.cloneElement(props.customInput, {
          disabled: props.disabled,
          onBlur: props.onBlur,
          onKeyDown: props.onKeyDown,
          readOnly: props.readOnly,
        })}
        <button
          type='button'
          onClick={() =>
            props.onKeyDown({
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
            props.onKeyDown({ key: ' ', preventDefault: vi.fn<() => void>() })
          }
        >
          Input Space trigger
        </button>
        {props.open ? (
          <div>
            <button type='button' onClick={() => props.onChange(mockDate)}>
              Pick date
            </button>
            <button
              type='button'
              onClick={() =>
                props.onKeyDown({
                  key: 'Escape',
                  preventDefault: vi.fn<() => void>(),
                })
              }
            >
              Escape
            </button>
            <button type='button' onClick={() => props.onClickOutside()}>
              Click outside
            </button>
            <button
              type='button'
              onClick={() => props.onBlur({ type: 'blur' })}
            >
              Blur picker
            </button>
            <button
              type='button'
              onClick={() =>
                props.onKeyDown({
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
                props.onKeyDown({
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
                props.onKeyDown({
                  key: 'Other',
                  preventDefault: vi.fn<() => void>(),
                })
              }
            >
              Other key
            </button>
            <output data-testid='selected-date'>
              {props.selected?.toISOString() || ''}
            </output>
            <output data-testid='open-date'>
              {props.openToDate?.toISOString() || ''}
            </output>
            <output data-testid='bottom-offset'>
              {String(
                props.popperModifiers[0].options.offset({
                  placement: 'bottom-start',
                })[1],
              )}
            </output>
            <output data-testid='top-offset'>
              {String(
                props.popperModifiers[0].options.offset({
                  placement: 'top-start',
                })[1],
              )}
            </output>
            <output data-testid='side-offset'>
              {String(
                props.popperModifiers[0].options.offset({
                  placement: 'right-start',
                })[1],
              )}
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
});

describe(CustomDatePicker, () => {
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
