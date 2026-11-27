import { Form } from 'react-bootstrap';
import SummaryDisplay from '../../SummaryDisplay';
import type { RhfSelectInputProps } from './types';
import { omitUndefined } from '../../../utils/omitUndefined';
import { useRhfFieldA11y } from '../useRhfFieldA11y';

type SelectOptions<T extends string | number> =
  RhfSelectInputProps<T>['options'];

type FieldState = ReturnType<typeof useRhfFieldA11y>;

const InlineHelp = ({
  inlineHelp,
  helpId,
}: Readonly<{
  inlineHelp: RhfSelectInputProps['inlineHelp'];
  helpId: FieldState['helpId'];
}>) =>
  inlineHelp ? (
    <Form.Text as='p' id={helpId} className='contextual-help text-muted'>
      {inlineHelp}
    </Form.Text>
  ) : null;

const displayTextFor = <T extends string | number>(
  options: SelectOptions<T>,
  value: unknown,
) => options?.find((option) => option.value === value)?.displayText;

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === '';

const toControlValue = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' ? value : '';

const SummaryView = <T extends string | number>({
  label,
  options,
  field,
}: Readonly<{
  label: RhfSelectInputProps<T>['label'];
  options: SelectOptions<T>;
  field: FieldState;
}>) =>
  isBlank(field.fieldValue) ? null : (
    <SummaryDisplay
      label={label}
      id={field.controlId}
      as='p'
      value={displayTextFor(options, field.fieldValue) ?? ''}
    />
  );

const ReadOnlyView = <T extends string | number>({
  label,
  inlineHelp,
  options,
  field,
}: Readonly<{
  label: RhfSelectInputProps<T>['label'];
  inlineHelp: RhfSelectInputProps['inlineHelp'];
  options: SelectOptions<T>;
  field: FieldState;
}>) => {
  const selectedText = displayTextFor(options, field.fieldValue) ?? '';
  return (
    <Form.Group controlId={field.controlId} className='form-field-container'>
      <Form.Label className={inlineHelp ? 'pb-0' : ''}>{label}</Form.Label>
      <InlineHelp inlineHelp={inlineHelp} helpId={field.helpId} />
      <Form.Control
        className='form-field form-text-input-read'
        type='text'
        name={field.fieldName}
        readOnly
        value={
          selectedText === ''
            ? String(toControlValue(field.fieldValue))
            : selectedText
        }
      />
    </Form.Group>
  );
};

const SelectView = <T extends string | number>({
  props,
  field,
}: Readonly<{ props: RhfSelectInputProps<T>; field: FieldState }>) => {
  const {
    label,
    inlineHelp,
    options,
    defaultValue = '', // default props
    defaultDisplayText,
    className = '', // default props
    containerClassName = '', // default props
    disabled,
    onChange,
    addBlank,
  } = props;
  const { errorMessage } = field;

  const onSelectChange = (rawValue: string) => {
    const selected = options?.find(
      (option) => String(option.value) === rawValue,
    );
    const nextValue = selected ? selected.value : defaultValue;
    field.onFieldChange(nextValue);
    onChange?.(nextValue);
  };

  return (
    <Form.Group controlId={field.controlId} className='form-field-container'>
      <Form.Label>{label}</Form.Label>
      <InlineHelp inlineHelp={inlineHelp} helpId={field.helpId} />
      <div className={`d-grid gap-2 ${containerClassName}`}>
        <Form.Control
          as='select'
          {...omitUndefined({
            disabled,
            'aria-describedby': field.describedBy,
            'aria-invalid': errorMessage ? true : undefined,
          })}
          className={`form-field form-select ${className}`}
          name={field.fieldName}
          ref={field.fieldRef}
          value={toControlValue(field.fieldValue)}
          onBlur={field.onFieldBlur}
          onChange={(event) => {
            onSelectChange(event.target.value);
          }}
          isInvalid={!!errorMessage}
        >
          {addBlank && (
            <option value={defaultValue}>
              {defaultDisplayText ?? 'Please select'}
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
          <Form.Control.Feedback type='invalid' id={field.validationMessageId}>
            {errorMessage}
          </Form.Control.Feedback>
        ) : null}
      </div>
    </Form.Group>
  );
};

/**
 * React Hook Form counterpart of `SelectInput`. It reads the form through
 * `useController`, so it must render inside a `FormProvider`. The field stores
 * the chosen option's typed value (or the blank option's value), not the event
 * string; `onChange` is a side-effect hook run after the update.
 */
const RhfSelectInput = <T extends string | number = string>(
  props: Readonly<RhfSelectInputProps<T>>,
) => {
  const { label, inlineHelp, options, name, id, isSummary, readOnly } = props;
  const field = useRhfFieldA11y({ name, id, inlineHelp });

  if (isSummary) {
    return <SummaryView label={label} options={options} field={field} />;
  }
  if (readOnly === true) {
    return (
      <ReadOnlyView
        label={label}
        inlineHelp={inlineHelp}
        options={options}
        field={field}
      />
    );
  }
  return <SelectView props={props} field={field} />;
};

export default RhfSelectInput;
