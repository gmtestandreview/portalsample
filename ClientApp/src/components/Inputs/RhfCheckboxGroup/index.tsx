import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Details from '../../forms/Details';
import { omitUndefined } from '../../../utils/omitUndefined';
import { useRhfFieldA11y } from '../useRhfFieldA11y';
import type { RhfCheckboxGroupProps, RhfCheckboxOption } from './types';

/**
 * React Hook Form counterpart of `CheckboxGroup`. The field holds the array of
 * selected option values (as the Formik checkbox array did), so it must render
 * inside a `FormProvider`. Ticking appends the value; unticking removes it.
 * `onChange` is a side-effect hook run after the update.
 *
 * In summary mode nothing is rendered: the Formik group compared the whole
 * array to a single option value, which never matched, so it rendered nothing
 * either. Summaries render their own selected labels.
 */
const RhfCheckboxGroup = <T,>(props: Readonly<RhfCheckboxGroupProps<T>>) => {
  const {
    displayHorizontally,
    inlineHelp,
    inlineHelpTitle,
    options,
    name,
    legend,
    id,
    onChange,
    isSummary,
    supressFieldLevelMessages,
    containerClassName = '', // default props
    legendClassName = '', // default props
    className = '', // default props
  } = props;

  const {
    fieldValue,
    fieldRef,
    fieldName,
    onFieldChange,
    onFieldBlur,
    controlId: legendId,
    helpId,
    validationMessageId,
    errorMessage,
    describedBy,
  } = useRhfFieldA11y({ name, id, inlineHelp, supressFieldLevelMessages });

  if (isSummary) {
    return null;
  }

  const selected: T[] = Array.isArray(fieldValue) ? (fieldValue as T[]) : [];

  const toggle = (value: T, checked: boolean) => {
    const next = checked
      ? [...selected, value]
      : selected.filter((item) => item !== value);
    onFieldChange(next);
    onChange?.(next);
  };

  const renderOption = (option: RhfCheckboxOption<T>, index: number) => {
    const optionId = option.id ?? `${legendId}-${index}`;
    return (
      <div className='form-field-container mb-0'>
        <div className={`checkbox ${className}`}>
          <input
            ref={index === 0 ? fieldRef : null}
            id={optionId}
            name={fieldName}
            type='checkbox'
            value={String(option.value)}
            checked={selected.includes(option.value)}
            disabled={option.disabled}
            onChange={(event) => {
              toggle(option.value, event.target.checked);
            }}
            onBlur={onFieldBlur}
          />
          <label htmlFor={optionId}>
            <i className='icon-tick' aria-hidden='true' />
            <span className='d-flex flex-column'>
              {option.label}
              {option.descriptor ? (
                <>
                  <br />{' '}
                  <span className='d-block mt-2 fw-normal text-body'>
                    {option.descriptor}
                  </span>
                </>
              ) : null}
            </span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <fieldset
      data-testid={`fs-${legendId}`}
      aria-describedby={describedBy}
      aria-invalid={errorMessage ? true : undefined}
    >
      <legend id={legendId} className={legendClassName}>
        {legend}
      </legend>
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
              <Col key={String(option.value)}>
                {renderOption(option, index)}
              </Col>
            ))}
          </Row>
        ) : (
          options.map((option, index) => (
            <div key={String(option.value)}>{renderOption(option, index)}</div>
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

export default RhfCheckboxGroup;
