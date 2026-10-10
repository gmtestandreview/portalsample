import Form from 'react-bootstrap/Form';
import { useController } from 'react-hook-form';
import SummaryDisplay from '../../SummaryDisplay';
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

  const { field, fieldState, formState } = useController({ name });
  const controlId = id || name;
  const helpId = inlineHelp ? `help-${controlId}` : undefined;
  const validationMessageId = `${controlId}-validation-msg`;
  const errorMessage =
    !supressFieldLevelMessages &&
    (fieldState.isTouched || formState.isSubmitted)
      ? fieldState.error?.message
      : undefined;

  if (isSummary) {
    return (
      <SummaryDisplay
        label={label}
        id={controlId}
        as='span'
        value={field.value ? 'Yes' : 'No'}
      />
    );
  }

  return (
    <div className={`form-field-container ${containerClassName}`}>
      <div className={`checkbox ${className}`}>
        <input
          ref={field.ref}
          id={controlId}
          name={field.name}
          type='checkbox'
          checked={!!field.value}
          disabled={disabled}
          onChange={(event) => {
            field.onChange(event.target.checked);
            onChange?.(event.target.checked);
          }}
          onBlur={field.onBlur}
          aria-describedby={errorMessage ? validationMessageId : helpId}
        />
        {inlineHelp && (
          <Form.Text id={helpId} className='contextual-help'>
            {inlineHelp}
          </Form.Text>
        )}
        <label htmlFor={controlId}>
          <i className='icon-tick' aria-hidden='true' />
          <span className='d-flex flex-column'>
            {label}
            {!!descriptor && (
              <>
                <br />{' '}
                <span className='d-block mt-2 fw-normal text-body'>
                  {descriptor}
                </span>
              </>
            )}
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

        {subFormField && (
          <div className='subform-field-container'>
            <div className='checklist-line' />
            {subFormField}
          </div>
        )}
      </div>
    </div>
  );
};

export default RhfCheckbox;
