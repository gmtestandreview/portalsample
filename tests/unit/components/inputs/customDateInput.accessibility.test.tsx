import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import CustomDateInput from '@/components/Inputs/DatePicker/CustomDateInput';

const renderInput = (props: Partial<React.ComponentProps<typeof CustomDateInput>> = {}) => render(
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

describe('CustomDateInput accessibility', () => {
    it('keeps the calendar picker button in the keyboard tab order', () => {
        renderInput();

        const calendarButton = screen.getByRole('button', { name: 'Choose your calibration date' });

        expect(calendarButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('renders the calendar icon as decorative hidden markup without a presentation role', () => {
        renderInput();

        const calendarButton = screen.getByRole('button', { name: 'Choose your calibration date' });
        const icon = calendarButton.querySelector('.icon-calendar');

        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(calendarButton.querySelector('[role="presentation"]')).toBeNull();
    });

    it('coordinates focus, blur, calendar opening, help, and validation feedback', async () => {
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
        const calendarButton = screen.getByRole('button', { name: 'Choose your calibration date' });
        const outside = document.createElement('button');
        document.body.appendChild(outside);

        expect(input).toHaveAccessibleDescription('Choose a valid date');
        expect(input).toHaveAttribute('placeholder', 'DD/MM/YYYY');
        expect(input).toHaveClass('extra-input');
        expect(screen.getByText('Use day, month, year')).toHaveAttribute('id', 'help-calibrationDate');
        expect(screen.getByText('Choose a valid date')).toHaveAttribute('id', 'calibrationDate-validation-msg');

        fireEvent.focus(input, { relatedTarget: null });
        expect(input.closest('.input-group')).toHaveClass('custom-focus');

        fireEvent.blur(input, { relatedTarget: calendarButton });
        expect(handleEnsureCalendarClosed).not.toHaveBeenCalled();
        expect(onBlur).not.toHaveBeenCalled();

        await user.click(calendarButton);
        expect(handleOpenCalendar).toHaveBeenCalledTimes(1);

        fireEvent.blur(calendarButton, { relatedTarget: outside });
        expect(handleEnsureCalendarClosed).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(input.closest('.input-group')).not.toHaveClass('custom-focus');

        fireEvent.change(input, { target: { value: '18/05/2026' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onChange).toHaveBeenCalled();
        expect(onKeyDown).toHaveBeenCalled();
    });

    it('disables the calendar button for disabled and read-only inputs', () => {
        const { rerender } = renderInput({ disabled: true });

        expect(screen.getByRole('button', { name: 'Choose your calibration date' })).toBeDisabled();

        rerender(
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
                        readOnly
                        wrapperUUID='date-wrapper'
                    />
                </div>
            </Formik>,
        );

        expect(screen.getByRole('button', { name: 'Choose your calibration date' })).toBeDisabled();
    });

    it('uses Formik touched errors to mark the text control invalid', () => {
        render(
            <Formik
                initialErrors={{ calibrationDate: 'Required' }}
                initialTouched={{ calibrationDate: true }}
                initialValues={{ calibrationDate: '' }}
                onSubmit={vi.fn()}
            >
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
                    />
                </div>
            </Formik>,
        );

        expect(screen.getByRole('textbox', { name: 'Calibration date' })).toHaveClass('is-invalid');
    });
});
