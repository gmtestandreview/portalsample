import { describe, it, expect } from 'vitest';

import { fireEvent, render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Formik } from 'formik';

import CustomDateInput from '@/components/Inputs/DatePicker/CustomDateInput';

const renderInput = (
  props: Partial<React.ComponentProps<typeof CustomDateInput>> = {},
) =>
  render(
    <Formik initialValues={{ calibrationDate: '' }} onSubmit={vi.fn()}>
      <div id='date-wrapper'>
        <CustomDateInput
          calendarButtonTitle='Calibration date'
          calendarOnKeyDown={vi.fn()}
          handleCloseCalendar={vi.fn()}
          handleEnsureCalendarClosed={vi.fn()}
          handleOpenCalendar={vi.fn()}
          label='Calibration date'
          name='calibrationDate'
          wrapperUUID='date-wrapper'
          {...props}
        />
      </div>
    </Formik>,
  );

describe('customDateInput accessibility', () => {
  it('keeps the calendar picker button in the keyboard tab order', () => {
    expect.assertions(1);
    renderInput();

    const calendarButton = screen.getByRole('button', {
      name: 'Choose your calibration date',
    });

    expect(calendarButton).not.toHaveAttribute('tabindex', '-1');
  });
});

describe('customDateInput accessibility', () => {
  it('renders the calendar icon as decorative hidden markup without a presentation role', () => {
    expect.assertions(2);
    renderInput();

    const calendarButton = screen.getByRole('button', {
      name: 'Choose your calibration date',
    });
    const icon = calendarButton.querySelector('.icon-calendar');

    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(calendarButton.querySelector('[role="presentation"]')).toBeNull();
  });
});

describe('customDateInput accessibility', () => {
  it('coordinates focus, blur, calendar opening, help, and validation feedback', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    const handleEnsureCalendarClosed = vi.fn();
    const handleOpenCalendar = vi.fn();
    const onBlur = vi.fn();
    const onChange = vi.fn();
    const onKeyDown = vi.fn();
    renderInput({
      className: 'extra-input',
      containerClassName: 'extra-container',
      errorMessage: 'Choose a valid date',
      handleEnsureCalendarClosed,
      handleOpenCalendar,
      hasError: true,
      inlineHelp: 'Use day, month, year',
      onBlur,
      onChange,
      onKeyDown,
      placeholder: 'DD/MM/YYYY',
    });
    const input = screen.getByRole('textbox', { name: 'Calibration date' });
    const calendarButton = screen.getByRole('button', {
      name: 'Choose your calibration date',
    });
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    expect(input).toHaveAccessibleDescription('Choose a valid date');
  });
});

describe('customDateInput accessibility', () => {
  it('coordinates focus, blur, calendar opening, help, and validation feedback', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    const handleEnsureCalendarClosed = vi.fn();
    const handleOpenCalendar = vi.fn();
    const onBlur = vi.fn();
    const onChange = vi.fn();
    const onKeyDown = vi.fn();
    renderInput({
      className: 'extra-input',
      containerClassName: 'extra-container',
      errorMessage: 'Choose a valid date',
      handleEnsureCalendarClosed,
      handleOpenCalendar,
      hasError: true,
      inlineHelp: 'Use day, month, year',
      onBlur,
      onChange,
      onKeyDown,
      placeholder: 'DD/MM/YYYY',
    });
    const input = screen.getByRole('textbox', { name: 'Calibration date' });
    const calendarButton = screen.getByRole('button', {
      name: 'Choose your calibration date',
    });
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    expect(input).toHaveAttribute('placeholder', 'DD/MM/YYYY');
  });
});
