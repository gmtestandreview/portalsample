import { useField } from 'formik';
import type { ChangeEvent } from 'react';
import Form from 'react-bootstrap/Form';
import { trim } from 'lodash';
import type { TextAreaInputProps } from './types';
import SummaryDisplay from '../../SummaryDisplay';

const TextAreaInput = ({
    label,
    inlineHelp,
    disabled,
    name,
    id,
    rows,
    placeholder,
    maxCharacters,
    containerClassName = '', // default props
    className = '', // default props
    isSummary,
}: TextAreaInputProps) => {
    const [_field, _meta, _fieldHelper] = useField(name);
    const helpId = inlineHelp ? `help-${id || name}` : undefined;

    if (isSummary) {
        return (
            <SummaryDisplay
                label={label}
                as='p'
                className='pre-wrap'
                value={_field.value}
                id={id || name}
            />
        );
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        // Strip supplementary-plane characters (emoji etc.) which the API rejects.
        const sanitised = event.target.value.replace(/[\u{10000}-\u{10FFFF}]/gu, '');
        _fieldHelper.setValue(sanitised);
    };

    const handleOnBlur = () => {
        const newValue = trim(_meta.value as string);
        _fieldHelper.setTouched(true);
        _fieldHelper.setValue(newValue);
    };

    let hasExceededMaximum = false;
    let counterText = '';

    if (maxCharacters && maxCharacters > 0) {
        const currCharacters = _field.value ? _field.value.trim().length : 0;
        counterText = `${currCharacters} of ${maxCharacters} characters used`;
        hasExceededMaximum = (currCharacters > Number(maxCharacters));
    }

    return (
        <Form.Group className={`form-field-container ${containerClassName}`} controlId={id || name}>
            <Form.Label>{label}</Form.Label>
            {inlineHelp
        && (
            <Form.Text as='p' id={helpId} className='contextual-help'>
                {inlineHelp}
            </Form.Text>
        ) }
            <Form.Control
                className={`form-field form-text-area ${className}`}
                as='textarea'
                rows={rows || 3}
                {..._field}
                value={_field.value ?? ''}
                isInvalid={!!(_meta.touched && _meta.error)}
                disabled={disabled}
                aria-describedby={
                    _meta.touched && _meta.error
                        ? `${id || name}-validation-msg`
                        : helpId
                }
                onChange={handleChange}
                onBlur={handleOnBlur}
                placeholder={placeholder}
            />
            {maxCharacters
      && (
          <div className={`text-end ${hasExceededMaximum ? 'counterLabelExceedsMax' : 'counterLabelWithinMax'}`}>
              <span className='small'>{counterText}</span>
          </div>
      )}
            {_meta.touched && _meta.error
                ? (
                    <Form.Control.Feedback
                        type='invalid'
                        id={`${id || name}-validation-msg`}
                        className='form-validation-message'
                    >
                        {_meta.error}
                        {hasExceededMaximum && (
                            <span className='visually-hidden'>
                                {', '}
                                {counterText}
                            </span>
                        )}
                    </Form.Control.Feedback>
                )
                : null}
        </Form.Group>
    );
};

export default TextAreaInput;
