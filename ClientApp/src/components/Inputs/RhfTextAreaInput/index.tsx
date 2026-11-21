import Form from 'react-bootstrap/Form';
import SummaryDisplay from '../../SummaryDisplay';
import { omitUndefined } from '../../../utils/omitUndefined';
import { useRhfFieldA11y } from '../useRhfFieldA11y';
import type { RhfTextAreaInputProps } from './types';
import { removeSupplementaryPlaneCharacters } from '../../../utils/removeSupplementaryPlaneCharacters';

const DEFAULT_ROWS = 3;
/**
 * React Hook Form counterpart of `TextAreaInput`. It reads the form through
 * `useController`, so it must render inside a `FormProvider`. Typed text has
 * supplementary-plane characters stripped; surrounding whitespace is trimmed
 * when the field loses focus (a nullish value becomes an empty string, as in
 * the legacy component). `maxCharacters` shows a live counter of trimmed
 * length and does not block typing.
 */
const RhfTextAreaInput = (props: Readonly<RhfTextAreaInputProps>) => {
  const {
    label,
    name,
    inlineHelp,
    disabled,
    id,
    rows,
    placeholder,
    maxCharacters,
    containerClassName = '', // default props
    className = '', // default props
    supressFieldLevelMessages,
    isSummary,
  } = props;

  const {
    fieldValue,
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
  const textValue = typeof fieldValue === 'string' ? fieldValue : '';

  if (isSummary) {
    return (
      <SummaryDisplay
        label={label}
        as='p'
        className='pre-wrap'
        value={textValue}
        id={controlId}
      />
    );
  }

  const handleBlur = () => {
    const trimmed = typeof fieldValue === 'string' ? fieldValue.trim() : '';
    if (trimmed !== fieldValue) {
      onFieldChange(trimmed);
    }
    onFieldBlur();
  };

  const showCounter = !!maxCharacters && maxCharacters > 0;
  const usedCharacters =
    typeof fieldValue === 'string' ? fieldValue.trim().length : 0;
  const counterText = showCounter
    ? `${usedCharacters} of ${maxCharacters} characters used`
    : '';
  const hasExceededMaximum = showCounter && usedCharacters > maxCharacters;

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
      <Form.Control
        className={`form-field form-text-area ${className}`}
        as='textarea'
        rows={rows ?? DEFAULT_ROWS}
        name={fieldName}
        ref={fieldRef}
        isInvalid={!!errorMessage}
        {...omitUndefined({
          disabled,
          'aria-describedby': describedBy,
          'aria-invalid': errorMessage ? true : undefined,
          placeholder,
        })}
        value={textValue}
        onBlur={handleBlur}
        onChange={(event) => {
          onFieldChange(removeSupplementaryPlaneCharacters(event.target.value));
        }}
      />
      {showCounter && (
        <div
          className={`text-end ${hasExceededMaximum ? 'counterLabelExceedsMax' : 'counterLabelWithinMax'}`}
        >
          <span className='small'>{counterText}</span>
        </div>
      )}
      {errorMessage ? (
        <Form.Control.Feedback
          type='invalid'
          id={validationMessageId}
          className='form-validation-message'
        >
          {errorMessage}
          {hasExceededMaximum && (
            <span className='visually-hidden'>
              {', '}
              {counterText}
            </span>
          )}
        </Form.Control.Feedback>
      ) : null}
    </Form.Group>
  );
};

export default RhfTextAreaInput;
