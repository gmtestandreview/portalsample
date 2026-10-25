import { describe, it, expect } from 'vitest';

import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import React from 'react';

import CustomDatePicker from '@/components/Inputs/DatePicker/CustomDatePicker';

const mockDate = new Date('2026-05-18T00:00:00.000Z');

vi.mock(
  import('@/components/Inputs/DatePicker/CustomDateInput'),
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

vi.mock(import('react-datepicker'), () => {
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
            props.onKeyDown({ key: 'Enter', preventDefault: vi.fn() })
          }
        >
          Input Enter trigger
        </button>
        <button
          type='button'
          onClick={() => props.onKeyDown({ key: ' ', preventDefault: vi.fn() })}
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
                props.onKeyDown({ key: 'Escape', preventDefault: vi.fn() })
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
                props.onKeyDown({ key: 'Enter', preventDefault: vi.fn() })
              }
            >
              Enter key
            </button>
            <button
              type='button'
              onClick={() =>
                props.onKeyDown({ key: ' ', preventDefault: vi.fn() })
              }
            >
              Space key
            </button>
            <button
              type='button'
              onClick={() =>
                props.onKeyDown({ key: 'Other', preventDefault: vi.fn() })
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
    expect.assertions(3);
    const dateOnChange = vi.fn();
    const dateOnBlur = vi.fn();

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
});

describe(CustomDatePicker, () => {
  it('supports an omitted calendar button title', () => {
    expect.assertions(1);
    render(
      <CustomDatePicker
        dateOnBlur={vi.fn()}
        dateOnChange={vi.fn()}
        name='untitledDate'
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Open calendar' }),
    ).toBeInTheDocument();
  });
});
