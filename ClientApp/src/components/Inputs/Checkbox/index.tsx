import { Field, useField } from 'formik';
import type { FieldHookConfig } from 'formik';
import Form from 'react-bootstrap/Form';
import SummaryDisplay from '../../SummaryDisplay';
import type { CheckboxProps } from './types';
import { getControlId } from '../getControlId';

const Checkbox = <T,>(
  props: Readonly<CheckboxProps<T> & Omit<FieldHookConfig<T>, 'value'>>,
) => {
  const {
    label,
    name,
    id,
    value,
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
  const controlId = getControlId(id, name);
  const helpId = inlineHelp ? `help-${controlId}` : undefined;

  const [_field, _meta] = useField<T>(name);

  if (isSummary) {
    return (
      <SummaryDisplay
        label={label}
        id={controlId}
        as='span'
        value={_field.value ? 'Yes' : 'No'}
      />
    );
  }

  return (
    <div className={`form-field-container ${containerClassName}`}>
      <div className={`checkbox ${className}`}>
        <Field
          {..._field}
          id={controlId}
          type='checkbox'
          name={name}
          value={value}
          disabled={disabled}
          onChange={onChange ?? _field.onChange}
          aria-describedby={
            !supressFieldLevelMessages && _meta.touched && _meta.error
              ? `${controlId}-validation-msg`
              : helpId
          }
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

        {!supressFieldLevelMessages && _meta.touched && _meta.error ? (
          <Form.Control.Feedback
            type='invalid'
            id={`${controlId}-validation-msg`}
            className='form-validation-message'
          >
            {_meta.error}
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

export default Checkbox;
