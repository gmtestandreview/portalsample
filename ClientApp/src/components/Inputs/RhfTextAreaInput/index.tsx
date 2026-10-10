import Form from 'react-bootstrap/Form';
import { useController } from 'react-hook-form';
import { trim } from 'lodash';
import SummaryDisplay from '../../SummaryDisplay';
import { omitUndefined } from '../../../utils/omitUndefined';
import type { RhfTextAreaInputProps } from './types';

const DEFAULT_ROWS = 3;
// Supplementary-plane characters (emoji etc.) are rejected by the API.
const SUPPLEMENTARY_PLANE_CHARACTERS = /[\u{10000}-\u{10FFFF}]/gu;

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

  if (isSummary) {
    return (
      <SummaryDisplay
        label={label}
        as='p'
        className='pre-wrap'
        value={field.value}
        id={controlId}
      />
    );
  }

  const handleBlur = () => {
    const trimmed = trim(field.value);
    if (trimmed !== field.value) {
      field.onChange(trimmed);
    }
    field.onBlur();
  };

  const showCounter = !!maxCharacters && maxCharacters > 0;
  const usedCharacters =
    typeof field.value === 'string' ? field.value.trim().length : 0;
  const counterText = showCounter
    ? `${usedCharacters} of ${maxCharacters} characters used`
    : '';
  const hasExceededMaximum = showCounter && usedCharacters > maxCharacters;

  return (
    <Form.Group
      className={`form-field-container ${containerClassName}`}
      controlId={controlId}
    >
      <Form.Label>{label}</Form.Label>
      {inlineHelp && (
        <Form.Text as='p' id={helpId} className='contextual-help'>
          {inlineHelp}
        </Form.Text>
      )}
      <Form.Control
        className={`form-field form-text-area ${className}`}
        as='textarea'
        rows={rows || DEFAULT_ROWS}
        name={field.name}
        ref={field.ref}
        isInvalid={!!errorMessage}
        {...omitUndefined({
          disabled,
          'aria-describedby': describedBy,
          'aria-invalid': errorMessage ? true : undefined,
          placeholder,
        })}
        value={field.value ?? ''}
        onBlur={handleBlur}
        onChange={(event) => {
          field.onChange(
            event.target.value.replace(SUPPLEMENTARY_PLANE_CHARACTERS, '')
          );
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
