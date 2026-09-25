import { Field, useField } from 'formik';
import type { FieldHookConfig } from 'formik';
import type { RadioButtonProps } from './types';

const RadioButton = <T,>(props: RadioButtonProps<T> & FieldHookConfig<T>) => {
    const {
        label,
        value,
        descriptor,
        disabled,
        id,
        name,
        subFormField,
        onChange,
    } = props;

    const [_field] = useField<T>(name);

    return (
        <div className='radio-button'>
            <Field
                {..._field}
                // Added this because when the underling data type is bool, the radio buttons didn't work.
                checked={value?.toString() === (_field.value ? _field.value.toString() : '')}
                type='radio'
                id={id}
                value={value}
                disabled={disabled}
                onChange={onChange ?? _field.onChange}
                aria-controls={subFormField ? `${id}-sub-field` : null}
            />
            <label htmlFor={id} data-testid={id} className={`form-field ${descriptor ? 'flex-column' : ''}`}>
                {label}
                {!!descriptor && (
                    <>
                        <br />
                        {' '}
                        <span className='d-block mt-3 fw-normal text-body'>{descriptor}</span>
                    </>
                )}
            </label>
            {subFormField
        && (
            <div id={`${id}-sub-field`} className='subform-field-container'>
                <div className='checklist-line' />
                {subFormField}
            </div>
        )}
        </div>
    );
};

export default RadioButton;
