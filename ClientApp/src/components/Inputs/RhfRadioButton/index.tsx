import { useController } from 'react-hook-form';
import type { RhfRadioButtonProps } from './types';

const stringOrEmpty = (value: unknown): string =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean'
    ? String(value)
    : '';

/**
 * React Hook Form counterpart of the stand-alone `RadioButton` (one radio laid
 * out by the caller). Checked state is a string comparison with the field
 * value, as in the earlier radio, so boolean and enum-backed fields both work.
 * Selecting always writes `value` to the field; `onChange` is a side-effect
 * hook run afterwards.
 */
const RhfRadioButton = <T,>(props: Readonly<RhfRadioButtonProps<T>>) => {
  const { label, value, descriptor, disabled, id, name, subFormField } = props;
  const { onChange } = props;
  const { field } = useController({ name });

  return (
    <div className='radio-button'>
      <input
        ref={field.ref}
        name={field.name}
        type='radio'
        id={id}
        value={String(value)}
        checked={String(value) === stringOrEmpty(field.value)}
        disabled={disabled}
        onChange={() => {
          field.onChange(value);
          onChange?.(value);
        }}
        onBlur={field.onBlur}
        aria-controls={subFormField ? `${id}-sub-field` : undefined}
      />
      <label
        htmlFor={id}
        data-testid={id}
        className={`form-field ${descriptor ? 'flex-column' : ''}`}
      >
        {label}
        {descriptor ? (
          <>
            <br />{' '}
            <span className='d-block mt-3 fw-normal text-body'>
              {descriptor}
            </span>
          </>
        ) : null}
      </label>
      {subFormField ? (
        <div id={`${id}-sub-field`} className='subform-field-container'>
          <div className='checklist-line' />
          {subFormField}
        </div>
      ) : null}
    </div>
  );
};

export default RhfRadioButton;
