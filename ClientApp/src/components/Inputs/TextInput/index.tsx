import Form from 'react-bootstrap/Form';
import type { AriaAttributes, AriaRole, ReactNode } from 'react';
import { useField } from 'formik';
import { trim } from 'lodash';
import { format, parseISO } from 'date-fns';
import SummaryDisplay from '../../SummaryDisplay';
import Details from '../../forms/Details';

export interface TextInputProps {
    label: string;
    name: string;
    inlineHelp?: string | ReactNode;
    inlineHelpTitle?: string;
    disabled?: boolean;
    readonly?: boolean;
    id?: string;
    type?: string;
    autoComplete?: string;
    placeholder?: string;
    containerClassName?: string;
    className?: string;
    isSummary?: boolean;
    onChange?: (e: unknown) => void;
    onBlur?: (e: unknown) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onClick?: (e: unknown) => void;
    onFocus?: (e: unknown) => void;
    role?: AriaRole;
    'aria-activedescendant'?: string;
    'aria-autocomplete'?: AriaAttributes['aria-autocomplete'];
    'aria-controls'?: string;
    'aria-expanded'?: AriaAttributes['aria-expanded'];
    'aria-haspopup'?: AriaAttributes['aria-haspopup'];
}

const TextInput = ({
    label,
    inlineHelp,
    inlineHelpTitle,
    disabled,
    readonly,
    name,
    id,
    type,
    autoComplete,
    placeholder,
    containerClassName = '', // default props
    className = '', // default props
    isSummary,
    onChange,
    onBlur,
    onKeyDown,
    onClick,
    onFocus,
    ...rest
}: TextInputProps) => {
    const [_field, _meta, _fieldHelper] = useField(name);
    const helpId = inlineHelp ? `help-${id || name}` : undefined;

    const getDate = (date: Date | string) => (typeof date === 'string' ? parseISO(date) : date);

    const formattedValue = type === 'date' && _meta.value
        ? format(getDate(_meta.value), 'yyyy-MM-dd')
        : _meta.value;

    if (isSummary) {
        const displayValue = type === 'date' && _field.value
            ? format(getDate(_field.value), 'dd/MM/yyyy')
            : _field.value;

        return (
            <SummaryDisplay
                label={label}
                value={displayValue}
                as='p'
                id={id || name}
            />
        );
    }

    const handleOnBlur = (e: any) => {
        if (onBlur !== undefined) {
            onBlur(e);
        }
        let newValue = type === 'date' && _meta.value ? format(getDate(_meta.value), 'yyyy-MM-dd') : _meta.value;
        newValue = trim(newValue as string);
        _fieldHelper.setValue(newValue);
        _fieldHelper.setTouched(true);
    };

    const handleOnChange = (e: any) => {
        if (onChange !== undefined) {
            onChange(e);
        }
        _field.onChange(e);
    };

    const handleOnKeyDown = (e: React.KeyboardEvent) => {
        if (onKeyDown !== undefined) {
            onKeyDown(e);
        }
    };

    const handleOnClick = (e: any) => {
        if (onClick !== undefined) {
            onClick(e);
        }
    };

    const handleFocus = (e: any) => {
        if (onFocus !== undefined) {
            onFocus(e);
        }
    };

    return (
        <Form.Group className={`form-field-container ${containerClassName}`} controlId={id || name}>
            <Form.Label>{label}</Form.Label>
            {inlineHelp && !inlineHelpTitle
              && (
                  <Form.Text as='p' id={helpId} className='contextual-help'>
                      {inlineHelp}
                  </Form.Text>
              )}
            {inlineHelp && inlineHelpTitle
              && (
                  <Details id={helpId} title={inlineHelpTitle} inlineHelp={inlineHelp} />
              )}
            <Form.Control
                className={`form-field form-text-input ${className}`}
                type={type || 'text'}
                {..._field}
                isInvalid={!!(_meta.touched && _meta.error)}
                disabled={disabled}
                readOnly={readonly}
                aria-describedby={
                    _meta.touched && _meta.error
                        ? `${id || name}-validation-msg`
                        : (helpId || undefined)
                }
                value={formattedValue || ''}
                autoComplete={autoComplete}
                onBlur={handleOnBlur}
                placeholder={type === 'date' ? 'dd/mm/yyyy' : placeholder}
                onChange={handleOnChange}
                onKeyDown={handleOnKeyDown}
                onClick={handleOnClick}
                onFocus={handleFocus}
                {...rest}
            />
            {_meta.touched && _meta.error
                ? (
                    <Form.Control.Feedback type='invalid' id={`${id || name}-validation-msg`} className='form-validation-message'>
                        {_meta.error}
                    </Form.Control.Feedback>
                )
                : null}
        </Form.Group>
    );
};

export default TextInput;
