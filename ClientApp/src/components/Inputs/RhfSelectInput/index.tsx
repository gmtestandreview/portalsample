import { Form } from 'react-bootstrap';
import SummaryDisplay from '../../SummaryDisplay';
import type { RhfSelectInputProps } from './types';
import { omitUndefined } from '../../../utils/omitUndefined';
import { useRhfFieldA11y } from '../useRhfFieldA11y';

/**
 * React Hook Form counterpart of `SelectInput`. It reads the form through
 * `useController`, so it must render inside a `FormProvider`. The field stores
 * the chosen option's typed value (or the blank option's value), not the event
 * string; `onChange` is a side-effect hook run after the update.
 */
const RhfSelectInput = <T extends string | number = string>(
  props: Readonly<RhfSelectInputProps<T>>
) => {
  const {
    label,
    inlineHelp,
    options,
    defaultValue = '', // default props
    defaultDisplayText,
    className = '', // default props
    containerClassName = '', // default props
    name,
    id,
    disabled,
    onChange,
    isSummary,
    addBlank,
  } = props;

  const {
    field,
    controlId,
    helpId,
    validationMessageId,
    errorMessage,
    describedBy,
  } = useRhfFieldA11y({ name, id, inlineHelp });

  if (isSummary) {
    if (field.value === undefined || field.value === null || field.value === '')
      return null;
    const selected = options?.find((option) => option.value === field.value);
    return (
      <SummaryDisplay
        label={label}
        id={controlId}
        as='p'
        value={selected?.displayText ?? ''}
      />
    );
  }

  const onSelectChange = (rawValue: string) => {
    const selected = options?.find(
      (option) => String(option.value) === rawValue
    );
    const nextValue = selected ? selected.value : defaultValue;
    field.onChange(nextValue);
    onChange?.(nextValue);
  };

  return (
    <Form.Group controlId={controlId} className='form-field-container'>
      <Form.Label>{label}</Form.Label>
      {inlineHelp && (
        <Form.Text as='p' id={helpId} className='contextual-help text-muted'>
          {inlineHelp}
        </Form.Text>
      )}
      <div className={`d-grid gap-2 ${containerClassName}`}>
        <Form.Control
          as='select'
          {...omitUndefined({
            disabled,
            'aria-describedby': describedBy,
            'aria-invalid': errorMessage ? true : undefined,
          })}
          className={`form-field form-select ${className}`}
          name={field.name}
          ref={field.ref}
          value={field.value ?? ''}
          onBlur={field.onBlur}
          onChange={(event) => onSelectChange(event.target.value)}
          isInvalid={!!errorMessage}
        >
          {addBlank && (
            <option value={defaultValue}>
              {defaultDisplayText || 'Please select'}
            </option>
          )}
          {options?.map((option) => (
            <option
              value={option.value}
              key={option.value}
              className={option.className}
              disabled={option.disabled}
              hidden={option.hidden}
            >
              {option.displayText}
            </option>
          ))}
        </Form.Control>
        {errorMessage ? (
          <Form.Control.Feedback type='invalid' id={validationMessageId}>
            {errorMessage}
          </Form.Control.Feedback>
        ) : null}
      </div>
    </Form.Group>
  );
};

export default RhfSelectInput;
