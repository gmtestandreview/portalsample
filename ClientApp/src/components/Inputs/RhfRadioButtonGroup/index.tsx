import { useController } from 'react-hook-form';
import type { FieldValues, UseControllerProps } from 'react-hook-form';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import type { RhfRadioButtonGroupProps, RhfRadioOption } from './types';
import Details from '../../forms/Details';
import SummaryDisplay from '../../SummaryDisplay';
import { omitUndefined } from '../../../utils/omitUndefined';

type Rules = UseControllerProps<FieldValues>['rules'];

/**
 * React Hook Form counterpart of `RadioButtonGroup`. It reads the form through
 * `useController`, so it must render inside a `FormProvider`. `onChange` is a
 * side-effect hook (analytics, derived state); the field value is always
 * updated by the group itself, with the option's typed value.
 */
const RhfRadioButtonGroup = <T,>(
  props: Readonly<RhfRadioButtonGroupProps<T> & { rules?: Rules }>
) => {
  const {
    displayHorizontally,
    inlineHelp,
    inlineHelpTitle,
    options,
    name,
    legend,
    id,
    onChange,
    disabled,
    isSummary,
    containerClassName = '', // default props
    className = '', // default props
    rules,
  } = props;

  const { field, fieldState, formState } = useController({
    name,
    ...omitUndefined({ rules }),
  });
  const baseId = id || name;
  const helpId = inlineHelp ? `help-${baseId}` : undefined;
  const validationMessageId = `${baseId}-validation-msg`;
  const showError =
    (fieldState.isTouched || formState.isSubmitted) &&
    fieldState.error?.message;

  if (isSummary) {
    if (!field.value) return null;
    const selectedOption = options.find(
      (option) => option.value === field.value
    );
    return (
      <SummaryDisplay
        label={legend}
        value={selectedOption?.label ?? 'No details added'}
        id={baseId}
        as='span'
        containerClassName={containerClassName}
        className={className}
      />
    );
  }

  const renderOption = (option: RhfRadioOption<T>, index: number) => {
    const { descriptor, subFormField } = option;
    const subFieldId = `${option.id}-sub-field`;
    return (
      <div className='radio-button'>
        <input
          ref={index === 0 ? field.ref : null}
          name={field.name}
          type='radio'
          id={option.id}
          value={String(option.value)}
          checked={String(option.value) === String(field.value ?? '')}
          disabled={disabled ?? option.disabled}
          onChange={() => {
            field.onChange(option.value);
            onChange?.(option.value);
          }}
          onBlur={field.onBlur}
          aria-controls={subFormField ? subFieldId : undefined}
        />
        <label
          htmlFor={option.id}
          data-testid={option.id}
          className={`form-field ${descriptor ? 'flex-column' : ''}`}
        >
          {option.label}
          {!!descriptor && (
            <>
              <br />{' '}
              <span className='d-block mt-3 fw-normal text-body'>
                {descriptor}
              </span>
            </>
          )}
        </label>
        {subFormField && (
          <div id={subFieldId} className='subform-field-container'>
            <div className='checklist-line' />
            {subFormField}
          </div>
        )}
      </div>
    );
  };

  return (
    <fieldset
      data-testid={`fs-${baseId}`}
      aria-describedby={showError ? validationMessageId : helpId}
    >
      <legend id={baseId}>{legend}</legend>
      <Form.Group
        id={name}
        className={`form-field-container ${containerClassName}`}
        tabIndex={-1}
      >
        {inlineHelp && !inlineHelpTitle && (
          <Form.Text as='p' id={helpId} className='contextual-help'>
            {inlineHelp}
          </Form.Text>
        )}
        {inlineHelp && inlineHelpTitle && (
          <Details
            {...omitUndefined({ id: helpId })}
            title={inlineHelpTitle}
            inlineHelp={inlineHelp}
          />
        )}
        {displayHorizontally ? (
          <Row>
            {options.map((option, index) => (
              <Col key={option.id}>{renderOption(option, index)}</Col>
            ))}
          </Row>
        ) : (
          options.map((option, index) => (
            <div key={option.id}>{renderOption(option, index)}</div>
          ))
        )}
        {showError ? (
          <Form.Control.Feedback
            type='invalid'
            id={validationMessageId}
            className='form-validation-message'
          >
            {fieldState.error?.message}
          </Form.Control.Feedback>
        ) : null}
      </Form.Group>
    </fieldset>
  );
};

export default RhfRadioButtonGroup;
