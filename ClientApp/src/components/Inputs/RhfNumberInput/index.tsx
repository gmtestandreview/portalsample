import Form from 'react-bootstrap/Form';
import { InputGroup } from 'react-bootstrap';
import SummaryDisplay from '../../SummaryDisplay';
import { getPhoneNumberFormat } from '../NumberInput/phoneFormat';
import { NumericFormatFixed, PatternFormatFixed } from '../NumberInput/types';
import { omitUndefined } from '../../../utils/omitUndefined';
import { useRhfFieldA11y } from '../useRhfFieldA11y';
import type { RhfNumberInputProps } from './types';

const PHONE_FORMAT_KEYWORD = 'checkPhoneFormat';

/**
 * React Hook Form counterpart of `NumberInput`. It reads the form through
 * `useController`, so it must render inside a `FormProvider`. As in the legacy
 * component the field stores the displayed (formatted) text, for example
 * `0412 345 678` or `1,234.50`, and an empty box stores an empty string.
 * With a `format` the box is a pattern input (use `checkPhoneFormat` to pick an
 * Australian phone pattern from the typed digits); otherwise it is a numeric
 * input. Nothing is reformatted on blur.
 */
const RhfNumberInput = (props: Readonly<RhfNumberInputProps>) => {
  const {
    label,
    name,
    inlineHelp,
    disabled,
    readonly,
    id,
    placeholder,
    containerClassName = '', // default props
    className = '', // default props
    prepend,
    format,
    maxLength,
    thousandSeparator,
    fixedDecimalScale,
    decimalScale,
    valueIsNumericString,
    allowNegative,
    supressFieldLevelMessages,
    isSummary,
  } = props;

  const {
    fieldValue: controlledValue,
    fieldRef,
    fieldName,
    onFieldChange,
    onFieldBlur,
    controlId,
    helpId,
    validationMessageId,
    errorMessage,
    describedBy,
  } = useRhfFieldA11y({ name, id, inlineHelp, supressFieldLevelMessages });

  const fieldValue =
    typeof controlledValue === 'string' || typeof controlledValue === 'number'
      ? String(controlledValue)
      : '';

  const resolvedFormat =
    format === PHONE_FORMAT_KEYWORD ? getPhoneNumberFormat(fieldValue) : format;

  if (isSummary) {
    return (
      <SummaryDisplay
        label={label}
        value={fieldValue}
        id={controlId}
        format={resolvedFormat}
        prefix={prepend}
        thousandSeparator={thousandSeparator}
        valueIsNumericString={valueIsNumericString}
        allowNegative={allowNegative}
        allowLeadingZeros={false}
      />
    );
  }

  const controlProps = {
    customInput: Form.Control,
    type: 'text',
    className: `form-field form-text-input mb-0 ${className}`,
    name: fieldName,
    getInputRef: fieldRef,
    isInvalid: !!errorMessage,
    onBlur: onFieldBlur,
    onChange: (event: { target: { value: string } }) => {
      onFieldChange(event.target.value);
    },
    value: fieldValue,
    displayType: 'input' as const,
    ...omitUndefined({
      disabled,
      readOnly: readonly,
      'aria-describedby': describedBy,
      'aria-invalid': errorMessage ? true : undefined,
      placeholder,
      maxLength,
      valueIsNumericString,
    }),
  };

  const renderControl = () =>
    format ? (
      <PatternFormatFixed
        {...controlProps}
        {...omitUndefined({ format: resolvedFormat })}
      />
    ) : (
      <NumericFormatFixed
        {...controlProps}
        {...omitUndefined({
          thousandSeparator,
          fixedDecimalScale,
          allowNegative,
          decimalScale,
        })}
        allowLeadingZeros={false}
      />
    );

  return (
    <Form.Group
      className={`form-field-container ${containerClassName}`}
      controlId={controlId}
    >
      {label ? <Form.Label>{label}</Form.Label> : null}
      {inlineHelp ? (
        <Form.Text as='p' id={helpId} className='contextual-help'>
          {inlineHelp}
        </Form.Text>
      ) : null}
      {prepend ? (
        <InputGroup>
          <InputGroup.Text id={`input-prepend-${controlId}`}>
            {prepend}
          </InputGroup.Text>
          {renderControl()}
        </InputGroup>
      ) : (
        renderControl()
      )}
      {errorMessage ? (
        <Form.Control.Feedback
          type='invalid'
          id={validationMessageId}
          className='form-validation-message'
        >
          {errorMessage}
        </Form.Control.Feedback>
      ) : null}
    </Form.Group>
  );
};

export default RhfNumberInput;
