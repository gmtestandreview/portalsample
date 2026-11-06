import { orIfEmpty } from '../../../utils/orIfEmpty';
import { useEffect, useRef } from 'react';
import Form from 'react-bootstrap/Form';
import { InputGroup } from 'react-bootstrap';
import { useField } from 'formik';
import { format as formatDate, parseISO } from 'date-fns';
import SummaryDisplay from '../../SummaryDisplay';
import { getPhoneNumberFormat } from './phoneFormat';
import { NumericFormatFixed, PatternFormatFixed } from './types';
import type { NumberInputProps } from './types';
import { omitUndefined } from '../../../utils/omitUndefined';
import { getControlId } from '../getControlId';

type NumberInputFieldValue = string | number | Date | null | undefined;

const formatInputValue = (
  type: string | undefined,
  value: NumberInputFieldValue,
): NumberInputFieldValue => {
  if (
    type !== 'date' ||
    !value ||
    !(typeof value === 'string' || value instanceof Date)
  ) {
    return value;
  }

  return formatDate(
    typeof value === 'string' ? parseISO(value) : value,
    'yyyy-MM-dd',
  );
};

const getDisplayFormat = (
  format: NumberInputProps['format'],
  phoneFormatValue: string | undefined,
): NumberInputProps['format'] =>
  format === 'checkPhoneFormat'
    ? getPhoneNumberFormat(phoneFormatValue)
    : format;

const renderInlineHelp = (
  inlineHelp: NumberInputProps['inlineHelp'],
  helpId: string | undefined,
) => {
  if (!inlineHelp) {
    return null;
  }

  return (
    <Form.Text as='p' id={helpId} className='contextual-help'>
      {inlineHelp}
    </Form.Text>
  );
};

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
  format,
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
}: Readonly<NumberInputProps>) => {
  const [field, meta, helpers] = useField<NumberInputFieldValue>(name);
  const controlId = getControlId(id, name);
  const helpId = inlineHelp ? `help-${controlId}` : undefined;
  const inputPrependId = prepend ? `input-prepend-${controlId}` : undefined;
  const inputAppendId = append ? `input-append-${controlId}` : undefined;
  const formattedValue = formatInputValue(type, meta.value);
  const displayValue = formattedValue ?? '';
  const phoneFormatValue =
    typeof formattedValue === 'string' ? formattedValue : undefined;
  const displayFormat = getDisplayFormat(format, phoneFormatValue);
  const { setValue } = helpers;
  const lastAppliedDefaultValue =
    useRef<NumberInputProps['defaultValue']>(undefined);
  useEffect(() => {
    const hasDefaultValue = defaultValue !== undefined && defaultValue !== null;

    if (
      hasDefaultValue &&
      !field.value &&
      lastAppliedDefaultValue.current !== defaultValue
    ) {
      lastAppliedDefaultValue.current = defaultValue;
      void setValue(defaultValue);
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
      {...omitUndefined({
        disabled,
        readOnly: readonly,
        'aria-describedby':
          meta.touched && meta.error ? `${controlId}-validation-msg` : helpId,
        autoComplete,
        placeholder,
        format: displayFormat,
        mask,
        minLength,
        maxLength,
        prefix,
        suffix,
        valueIsNumericString,
        allowemptyformatting,
        renderText,
      })}
      value={displayValue}
      displayType={displayType}
    />
  );

  const renderNumericFormat = () => (
    <NumericFormatFixed
      customInput={Form.Control}
      type='text'
      className={`form-field form-text-input mb-0 ${className}`}
      {...field}
      isInvalid={!!(meta.touched && meta.error)}
      {...omitUndefined({
        disabled,
        readOnly: readonly,
        'aria-describedby':
          meta.touched && meta.error ? `${controlId}-validation-msg` : helpId,
        autoComplete,
        placeholder,
        mask,
        minLength,
        maxLength,
        prefix,
        suffix,
        thousandSeparator,
        fixedDecimalScale,
        valueIsNumericString,
        allowNegative,
        allowemptyformatting,
        renderText,
        allowedDecimalSeparators,
        decimalScale,
      })}
      value={displayValue}
      displayType={displayType}
      allowLeadingZeros={allowLeadingZeros}
    />
  );

  if (isSummary) {
    return (
      <SummaryDisplay
        label={label}
        value={field.value == null ? undefined : String(field.value)}
        as={as}
        id={controlId}
        format={displayFormat}
        mask={mask}
        prepend={prepend}
        append={append}
        prefix={orIfEmpty(prefix, prepend)}
        suffix={orIfEmpty(suffix, append)}
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
    <Form.Group
      className={`form-field-container ${containerClassName}`}
      controlId={controlId}
    >
      {label && <Form.Label>{label}</Form.Label>}
      {renderInlineHelp(inlineHelp, helpId)}
      {(!!prepend || !!append) && (
        <InputGroup>
          {prepend && (
            <InputGroup.Text id={inputPrependId}>{prepend}</InputGroup.Text>
          )}
          {format ? renderPatternFormat() : renderNumericFormat()}

          {append && (
            <InputGroup.Text id={inputAppendId}>{append}</InputGroup.Text>
          )}
        </InputGroup>
      )}
      {!prepend &&
        !append &&
        (format ? renderPatternFormat() : renderNumericFormat())}
      {meta.touched && meta.error ? (
        <Form.Control.Feedback
          type='invalid'
          id={`${controlId}-validation-msg`}
          className='form-validation-message'
        >
          {meta.error}
        </Form.Control.Feedback>
      ) : null}
    </Form.Group>
  );
};

export default NumberInput;
