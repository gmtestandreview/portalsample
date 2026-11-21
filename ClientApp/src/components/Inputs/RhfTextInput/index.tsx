import Form from 'react-bootstrap/Form';
import SummaryDisplay from '../../SummaryDisplay';
import Details from '../../forms/Details';
import { omitUndefined } from '../../../utils/omitUndefined';
import { useRhfFieldA11y } from '../useRhfFieldA11y';
import type { RhfTextInputProps } from './types';

/**
 * React Hook Form counterpart of `TextInput`. It reads the form through
 * `useController`, so it must render inside a `FormProvider`. The field stores
 * the typed text; surrounding whitespace is trimmed when the field loses focus.
 * `onChange` and `onBlur` are side-effect hooks run alongside the field update.
 */
const RhfTextInput = (props: Readonly<RhfTextInputProps>) => {
  const {
    label,
    name,
    inlineHelp,
    inlineHelpTitle,
    disabled,
    readonly,
    id,
    autoComplete,
    placeholder,
    containerClassName = '', // default props
    className = '', // default props
    isSummary,
    onChange,
    onBlur,
    supressFieldLevelMessages,
  } = props;

  const {
    fieldName,
    fieldValue: controlledValue,
    fieldRef,
    onFieldChange,
    onFieldBlur,
    controlId,
    helpId,
    validationMessageId,
    errorMessage,
    describedBy,
  } = useRhfFieldA11y({ name, id, inlineHelp, supressFieldLevelMessages });

  const fieldValue = typeof controlledValue === 'string' ? controlledValue : '';
  const hasInlineHelp = Boolean(inlineHelp);
  const hasInlineHelpTitle = Boolean(inlineHelpTitle);

  if (isSummary) {
    return (
      <SummaryDisplay label={label} value={fieldValue} as='p' id={controlId} />
    );
  }

  const handleBlur = () => {
    onBlur?.();
    if (typeof controlledValue === 'string') {
      const trimmed = controlledValue.trim();
      if (trimmed !== controlledValue) {
        onFieldChange(trimmed);
      }
    }
    onFieldBlur();
  };

  return (
    <Form.Group
      className={`form-field-container ${containerClassName}`}
      controlId={controlId}
    >
      <Form.Label>{label}</Form.Label>
      {hasInlineHelp && !hasInlineHelpTitle ? (
        <Form.Text as='p' id={helpId} className='contextual-help'>
          {inlineHelp}
        </Form.Text>
      ) : null}
      {hasInlineHelp && hasInlineHelpTitle ? (
        <Details
          {...omitUndefined({ id: helpId })}
          title={inlineHelpTitle}
          inlineHelp={inlineHelp}
        />
      ) : null}
      <Form.Control
        className={`form-field form-text-input ${className}`}
        type='text'
        name={fieldName}
        ref={fieldRef}
        isInvalid={!!errorMessage}
        {...omitUndefined({
          disabled,
          readOnly: readonly,
          'aria-describedby': describedBy,
          'aria-invalid': errorMessage ? true : undefined,
          autoComplete,
          placeholder,
        })}
        value={fieldValue}
        onBlur={handleBlur}
        onChange={(event) => {
          onFieldChange(event.target.value);
          onChange?.(event.target.value);
        }}
      />
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

export default RhfTextInput;
