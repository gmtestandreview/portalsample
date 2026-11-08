import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import type { RhfRadioButtonGroupProps, RhfRadioOption } from './types';
import Details from '../../forms/Details';
import SummaryDisplay from '../../SummaryDisplay';
import { omitUndefined } from '../../../utils/omitUndefined';
import { useRhfFieldA11y } from '../useRhfFieldA11y';
import type { RhfRules } from '../useRhfFieldA11y';

/**
 * React Hook Form counterpart of `RadioButtonGroup`. It reads the form through
 * `useController`, so it must render inside a `FormProvider`. `onChange` is a
 * side-effect hook (analytics, derived state); the field value is always
 * updated by the group itself, with the option's typed value.
 */
const RhfRadioButtonGroup = <T,>(
  props: Readonly<RhfRadioButtonGroupProps<T> & { rules?: RhfRules }>,
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

  const {
    fieldValue,
    fieldRef,
    fieldName,
    onFieldChange,
    onFieldBlur,
    controlId: baseId,
    helpId,
    validationMessageId,
    errorMessage,
    describedBy,
  } = useRhfFieldA11y({ name, id, inlineHelp, rules });

  if (isSummary) {
    if (!fieldValue) return null;
    const selectedOption = options.find(
      (option) => option.value === fieldValue,
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
          ref={index === 0 ? fieldRef : null}
          name={fieldName}
          type='radio'
          id={option.id}
          value={String(option.value)}
          checked={option.value === fieldValue}
          disabled={disabled ?? option.disabled}
          onChange={() => {
            onFieldChange(option.value);
            onChange?.(option.value);
          }}
          onBlur={onFieldBlur}
          aria-controls={subFormField ? subFieldId : undefined}
        />
        <label
          htmlFor={option.id}
          data-testid={option.id}
          className={`form-field ${descriptor ? 'flex-column' : ''}`}
        >
          {option.label}
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
          <div id={subFieldId} className='subform-field-container'>
            <div className='checklist-line' />
            {subFormField}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <fieldset
      data-testid={`fs-${baseId}`}
      role='radiogroup'
      aria-describedby={describedBy}
      aria-invalid={errorMessage ? true : undefined}
    >
      <legend id={baseId}>{legend}</legend>
      <Form.Group
        id={name}
        className={`form-field-container ${containerClassName}`}
        tabIndex={-1}
      >
        {inlineHelp && !inlineHelpTitle ? (
          <Form.Text as='p' id={helpId} className='contextual-help'>
            {inlineHelp}
          </Form.Text>
        ) : null}
        {inlineHelp && inlineHelpTitle ? (
          <Details
            {...omitUndefined({ id: helpId })}
            title={inlineHelpTitle}
            inlineHelp={inlineHelp}
          />
        ) : null}
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
    </fieldset>
  );
};

export default RhfRadioButtonGroup;
