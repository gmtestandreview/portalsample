import Form from 'react-bootstrap/Form';
import { InputGroup } from 'react-bootstrap';
import { useController } from 'react-hook-form';
import SummaryDisplay from '../../SummaryDisplay';
import { getPhoneNumberFormat } from '../NumberInput/phoneFormat';
import { NumericFormatFixed, PatternFormatFixed } from '../NumberInput/types';
import { omitUndefined } from '../../../utils/omitUndefined';
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

  const { field, fieldState, formState } = useController({ name });
  const controlId = id || name;
  const helpId = inlineHelp ? `help-${controlId}` : undefined;
  const validationMessageId = `${controlId}-validation-msg`;
  const errorMessage =
    !supressFieldLevelMessages &&
    (fieldState.isTouched || formState.isSubmitted)
      ? fieldState.error?.message
      : undefined;

  const describedBy =
    [helpId, errorMessage ? validationMessageId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  const resolvedFormat =
    format === PHONE_FORMAT_KEYWORD
      ? getPhoneNumberFormat(field.value)
      : format;

  if (isSummary) {
    return (
      <SummaryDisplay
        label={label}
        value={field.value}
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
    name: field.name,
    getInputRef: field.ref,
    isInvalid: !!errorMessage,
    onBlur: field.onBlur,
    onChange: (event: { target: { value: string } }) => {
      field.onChange(event.target.value);
    },
    value: field.value || '',
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
      {label && <Form.Label>{label}</Form.Label>}
      {inlineHelp && (
        <Form.Text as='p' id={helpId} className='contextual-help'>
          {inlineHelp}
        </Form.Text>
      )}
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
