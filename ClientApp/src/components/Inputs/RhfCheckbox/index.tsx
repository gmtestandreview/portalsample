import Form from 'react-bootstrap/Form';
import SummaryDisplay from '../../SummaryDisplay';
import { useRhfFieldA11y } from '../useRhfFieldA11y';
import type { RhfCheckboxProps } from './types';

/**
 * React Hook Form counterpart of `Checkbox`. It reads the form through
 * `useController`, so it must render inside a `FormProvider`. The field stores
 * a boolean; `onChange` is a side-effect hook run after the update.
 */
const RhfCheckbox = (props: Readonly<RhfCheckboxProps>) => {
  const {
    label,
    name,
    id,
    descriptor,
    disabled,
    inlineHelp,
    supressFieldLevelMessages,
    containerClassName = '', // default props
    className = '', // default props
    subFormField,
    isSummary,
    onChange,
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

  if (isSummary) {
    return (
      <SummaryDisplay
        label={label}
        id={controlId}
        as='span'
        value={fieldValue ? 'Yes' : 'No'}
      />
    );
  }

  return (
    <div className={`form-field-container ${containerClassName}`}>
      <div className={`checkbox ${className}`}>
        <input
          ref={fieldRef}
          id={controlId}
          name={fieldName}
          type='checkbox'
          checked={!!fieldValue}
          disabled={disabled}
          onChange={(event) => {
            onFieldChange(event.target.checked);
            onChange?.(event.target.checked);
          }}
          onBlur={onFieldBlur}
          className={errorMessage ? 'is-invalid' : undefined}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={describedBy}
        />
        {inlineHelp ? (
          <Form.Text id={helpId} className='contextual-help'>
            {inlineHelp}
          </Form.Text>
        ) : null}
        <label htmlFor={controlId}>
          <i className='icon-tick' aria-hidden='true' />
          <span className='d-flex flex-column'>
            {label}
            {descriptor ? (
              <>
                <br />{' '}
                <span className='d-block mt-2 fw-normal text-body'>
                  {descriptor}
                </span>
              </>
            ) : null}
          </span>
        </label>

        {errorMessage ? (
          <Form.Control.Feedback
            type='invalid'
            id={validationMessageId}
            className='form-validation-message'
          >
            {errorMessage}
          </Form.Control.Feedback>
        ) : null}

        {subFormField ? (
          <div className='subform-field-container'>
            <div className='checklist-line' />
            {subFormField}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RhfCheckbox;
