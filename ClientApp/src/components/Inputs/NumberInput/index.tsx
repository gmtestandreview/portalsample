import { useEffect, useRef } from 'react';
import Form from 'react-bootstrap/Form';
import { InputGroup } from 'react-bootstrap';
import { useField } from 'formik';
import { format as formatDate, parseISO } from 'date-fns';
import SummaryDisplay from '../../SummaryDisplay';
import { getPhoneNumberFormat } from './phoneFormat';
import { NumericFormatFixed, PatternFormatFixed } from './types';
import type { NumberInputProps } from './types';

const NumberInput = ({
    label,
    inlineHelp,
    disabled,
    readonly,
    name,
    id,
    type,
    autoComplete,
    placeholder,
    containerClassName = '', // default props
    className = '', // default props
    prepend,
    append,
    as = 'span', // default props
    displayType = 'input', // default props
    format = undefined, // default props
    mask,
    minLength,
    maxLength,
    prefix,
    suffix,
    thousandSeparator,
    valueIsNumericString,
    allowNegative,
    allowemptyformatting,
    allowLeadingZeros = false, // default props
    renderText,
    allowedDecimalSeparators,
    fixedDecimalScale,
    decimalScale,
    isSummary,
    defaultValue,
}: NumberInputProps) => {
    const [field, meta, helpers] = useField(name);
    const helpId = inlineHelp ? `help-${id || name}` : undefined;
    const inputPrependId = prepend ? `input-prepend-${id || name}` : undefined;
    const inputAppendId = append ? `input-append-${id || name}` : undefined;
    const getDate = (date: Date | string) => (typeof date === 'string' ? parseISO(date) : date);
    const formattedValue = type === 'date' && meta.value ? formatDate(getDate(meta.value), 'yyyy-MM-dd') : meta.value;
    const { setValue } = helpers;
    const lastAppliedDefaultValue = useRef<NumberInputProps['defaultValue']>(undefined);
    useEffect(() => {
        const hasDefaultValue = defaultValue !== undefined && defaultValue !== null;

        if (hasDefaultValue && !field.value && lastAppliedDefaultValue.current !== defaultValue) {
            lastAppliedDefaultValue.current = defaultValue;
            setValue(defaultValue);
        }
    }, [defaultValue, field.value, setValue]);

    // Note: This sub render is required for React-Number-Format v5, which splits the v4 from 1 component into 2 main components:
    // 1. PatternFormat - for custom phone numbers, credit cards etc
    // 2. NumericFormat - for standard large numbers, currency etc
    // Ref: https://s-yadav.github.io/react-number-format/docs/migration
    const renderPatternFormat = () => (
        <PatternFormatFixed
            customInput={Form.Control}
            type='text'
            className={`form-field form-text-input mb-0 ${className}`}
            {...field}
            isInvalid={!!(meta.touched && meta.error)}
            disabled={disabled}
            readOnly={readonly}
            aria-describedby={
                meta.touched && meta.error
                    ? `${id || name}-validation-msg`
                    : (helpId || undefined)
            }
            value={formattedValue || ''}
            autoComplete={autoComplete}
            placeholder={placeholder}
            displayType={displayType}
            format={
                format === 'checkPhoneFormat'
                    ? getPhoneNumberFormat(formattedValue)
                    : format
            }
            mask={mask}
            minLength={minLength}
            maxLength={maxLength}
            prefix={prefix}
            suffix={suffix}
            valueIsNumericString={valueIsNumericString}
            allowemptyformatting={allowemptyformatting}
            renderText={renderText}
            role={undefined}
        >
            {undefined}
        </PatternFormatFixed>
    );

    const renderNumericFormat = () => (
        <NumericFormatFixed
            customInput={Form.Control}
            type='text'
            className={`form-field form-text-input mb-0 ${className}`}
            {...field}
            isInvalid={!!(meta.touched && meta.error)}
            disabled={disabled}
            readOnly={readonly}
            aria-describedby={
                meta.touched && meta.error
                    ? `${id || name}-validation-msg`
                    : (helpId || undefined)
            }
            value={formattedValue || ''}
            autoComplete={autoComplete}
            placeholder={placeholder}
            displayType={displayType}
            mask={mask}
            minLength={minLength}
            maxLength={maxLength}
            prefix={prefix}
            suffix={suffix}
            thousandSeparator={thousandSeparator}
            fixedDecimalScale={fixedDecimalScale}
            valueIsNumericString={valueIsNumericString}
            allowNegative={allowNegative}
            allowemptyformatting={allowemptyformatting}
            allowLeadingZeros={allowLeadingZeros}
            renderText={renderText}
            allowedDecimalSeparators={allowedDecimalSeparators}
            decimalScale={decimalScale}
            role={undefined}
        >
            {undefined}
        </NumericFormatFixed>
    );

    if (isSummary) {
        return (
            <SummaryDisplay
                label={label}
                value={field.value}
                as={as}
                id={id || name}
                format={
                    format === 'checkPhoneFormat'
                        ? getPhoneNumberFormat(formattedValue)
                        : format
                }
                mask={mask}
                prepend={prepend}
                append={append}
                prefix={prefix || prepend}
                suffix={suffix || append}
                thousandSeparator={thousandSeparator}
                valueIsNumericString={valueIsNumericString}
                allowNegative={allowNegative}
                allowemptyformatting={allowemptyformatting}
                allowLeadingZeros={allowLeadingZeros}
                renderText={renderText}
                allowedDecimalSeparators={allowedDecimalSeparators}
            />
        );
    }
    return (
        <Form.Group className={`form-field-container ${containerClassName}`} controlId={id || name}>
            {label && (
                <Form.Label>{label}</Form.Label>
            )}
            {inlineHelp
          && (
              <Form.Text as='p' id={helpId} className='contextual-help'>
                  {inlineHelp}
              </Form.Text>
          )}
            {(prepend || append) && (
                <InputGroup>
                    {(prepend) && (
                        <InputGroup.Text id={inputPrependId}>{prepend}</InputGroup.Text>
                    )}
                    {format
                        ? renderPatternFormat()
                        : renderNumericFormat()}

                    {(append) && (
                        <InputGroup.Text id={inputAppendId}>{append}</InputGroup.Text>
                    )}
                </InputGroup>
            )}
            {(!prepend && !append) && (
                format
                    ? renderPatternFormat()
                    : renderNumericFormat()

            )}
            {meta.touched && meta.error
                ? (
                    <Form.Control.Feedback type='invalid' id={`${id || name}-validation-msg`} className='form-validation-message'>
                        {meta.error}
                    </Form.Control.Feedback>
                )
                : null}
        </Form.Group>
    );
};

export default NumberInput;
