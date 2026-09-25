import { useField } from 'formik';
import React, { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';

import findElementInTreeById from '../../Utilities/findElementInTreeById';
import type { CustomInputControlRef, CustomInputForwardRefProps } from './types';

/**
 * Formik-connected text input and calendar trigger used by `CustomDatePicker`.
 * The input and button behave as one focusable field so validation and calendar
 * state remain consistent while focus moves between them.
 */
const CustomDateInput = React.forwardRef<CustomInputControlRef, CustomInputForwardRefProps>((customInputProps, _ref) => {
    const {
        calendarButtonTitle,
        calendarOnKeyDown,
        className,
        containerClassName,
        disabled,
        errorMessage,
        forwardedFeedbackRef,
        forwardedInlineHelpRef,
        forwardedControlRef,
        hasError,
        inlineHelp,
        label,
        name,
        onBlur,
        onChange,
        onKeyDown,
        handleCloseCalendar: _handleCloseCalendar,
        handleEnsureCalendarClosed,
        handleOpenCalendar,
        placeholder,
        readOnly,
        wrapperUUID,
        ...theRest
    } = customInputProps;

    const [_field, _meta] = useField(name);
    const helpId = inlineHelp ? `help-${name}` : undefined;
    const [focused, setFocused] = useState(false);

    // This is required as the input field and calendar button have different onFocus/onBlur events
    // which triggered Formik onBlur if either were blurred.  This approach ensures that the Formik
    // onBlur is only called if the new focus is not on the input field or calendar button
    const handleInputAndButtonFocusEvents = (
     
        event: React.FocusEvent<any>,
        targetLosingFocus: Element | null,
        targetReceivingFocus: Element | null,
        elementId: string,
    ) => {
        const targetLosingFocusInElement = findElementInTreeById(targetLosingFocus, elementId);
        const targetReceivingFocusInElement = findElementInTreeById(targetReceivingFocus, elementId);

        if (targetLosingFocusInElement && targetReceivingFocus !== null && !targetReceivingFocusInElement) {
            handleEnsureCalendarClosed();
            onBlur?.call(this, event);
            setFocused(false);
        } else {
            setFocused(true);
        }
    };

    const handleCustomBlur = <E extends HTMLElement>(event: React.FocusEvent<E, Element>) => {
    // OnBlur - target is what loses the focus and related target is what receives focus (if any)
        handleInputAndButtonFocusEvents(event, event.target, event.relatedTarget, wrapperUUID);
    };

    const handleCustomFocus = <E extends HTMLElement>(event: React.FocusEvent<E, Element>) => {
    // OnFocus - target is what receives the focus and related target is what loses focus (if any)
        handleInputAndButtonFocusEvents(event, event.relatedTarget, event.target, wrapperUUID);
    };

    const handleCustomOnClick = () => {
        setFocused(true);
        handleOpenCalendar();
    };

    return (
        <Form.Group
            className={`form-field-container ${containerClassName}`}
            controlId={name}
        >
            {label && <Form.Label>{label}</Form.Label>}
            {inlineHelp && (
                <Form.Text
                    as='p'
                    id={helpId}
                    className='contextual-help'
                    ref={forwardedInlineHelpRef}
                >
                    {inlineHelp}
                </Form.Text>
            )}

            <InputGroup className={`w-md-50 ${focused ? 'custom-focus' : ''}`}>
                <Form.Control
                    {...theRest}
                    aria-describedby={
                        hasError
                            ? `${name}-validation-msg`
                            : (helpId || undefined)
                    }
                    disabled={disabled}
                    className={`form-field form-text-input ${className || ''}`}
                    isInvalid={!!(_meta.touched && _meta.error)}
                    onChange={onChange}
                    onBlur={handleCustomBlur}
                    onFocus={handleCustomFocus}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    ref={forwardedControlRef}
                    type='text'
                />

                <button
                    aria-label={`Choose your ${calendarButtonTitle.toLowerCase()}`}
                    aria-describedby={helpId}
                    className='custom-input-button'
                    disabled={disabled || readOnly}
                    onBlur={handleCustomBlur}
                    onClick={handleCustomOnClick}
                    onFocus={handleCustomFocus}
                    onKeyDown={calendarOnKeyDown}
                    title={calendarButtonTitle}
                    type='button'
                >
                    <span
                        className='icon-calendar'
                        aria-hidden='true'
                    />
                </button>

            </InputGroup>

            { hasError ? (
                <Form.Control.Feedback
                    ref={forwardedFeedbackRef}
                    type='invalid'
                    id={`${name}-validation-msg`}
                    className='form-validation-message'
                >
                    { errorMessage}
                </Form.Control.Feedback>
            ) : null}

        </Form.Group>
    );
});

CustomDateInput.displayName = 'CustomDateInput';

export default CustomDateInput;
