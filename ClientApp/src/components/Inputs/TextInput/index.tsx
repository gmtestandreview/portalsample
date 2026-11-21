import Form from 'react-bootstrap/Form';
import type {
  AriaAttributes,
  AriaRole,
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from 'react';
import { useField } from 'formik';
import { format, parseISO } from 'date-fns';
import SummaryDisplay from '../../SummaryDisplay';
import Details from '../../forms/Details';
import { omitUndefined } from '../../../utils/omitUndefined';
import { getControlId } from '../getControlId';

export interface TextInputProps {
  label: string;
  name: string;
  inlineHelp?: string | ReactNode;
  inlineHelpTitle?: string;
  disabled?: boolean;
  readonly?: boolean;
  id?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  containerClassName?: string;
  className?: string;
  isSummary?: boolean | undefined;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onClick?: (e: MouseEvent<HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  role?: AriaRole;
  'aria-activedescendant'?: string;
  'aria-autocomplete'?: AriaAttributes['aria-autocomplete'];
  'aria-controls'?: string;
  'aria-expanded'?: AriaAttributes['aria-expanded'];
  'aria-haspopup'?: AriaAttributes['aria-haspopup'];
}

const getDate = (date: Date | string) =>
  typeof date === 'string' ? parseISO(date) : date;

const formatDateValue = (
  type: string | undefined,
  value: string | undefined,
  pattern: string,
) => (type === 'date' && value ? format(getDate(value), pattern) : value);

const TextInput = ({
  label,
  inlineHelp,
  inlineHelpTitle,
  disabled,
  readonly,
  name,
  id,
  type,
  autoComplete,
  placeholder,
  containerClassName = '', // default props
  className = '', // default props
  isSummary,
  onChange,
  onBlur,
  onKeyDown,
  onClick,
  onFocus,
  ...rest
}: Readonly<TextInputProps>) => {
  const [_field, _meta, _fieldHelper] = useField<string | undefined>(name);
  const controlId = getControlId(id, name);
  const helpId = inlineHelp ? `help-${controlId}` : undefined;

  const formattedValue = formatDateValue(type, _meta.value, 'yyyy-MM-dd');
  const hasError = !!(_meta.touched && _meta.error);

  if (isSummary) {
    const displayValue = formatDateValue(type, _field.value, 'dd/MM/yyyy');

    return (
      <SummaryDisplay
        label={label}
        value={displayValue}
        as='p'
        id={controlId}
      />
    );
  }

  const handleOnBlur = (e: FocusEvent<HTMLInputElement>) => {
    onBlur?.(e);
    const newValue = formattedValue?.trim() ?? '';
    void _fieldHelper.setValue(newValue);
    void _fieldHelper.setTouched(true);
  };

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    _field.onChange(e);
  };

  const handleOnKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
  };

  const handleOnClick = (e: MouseEvent<HTMLInputElement>) => {
    onClick?.(e);
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    onFocus?.(e);
  };

  return (
    <Form.Group
      className={`form-field-container ${containerClassName}`}
      controlId={controlId}
    >
      <Form.Label>{label}</Form.Label>
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
      <Form.Control
        className={`form-field form-text-input ${className}`}
        type={type ?? 'text'}
        {..._field}
        isInvalid={hasError}
        {...omitUndefined({
          disabled,
          readOnly: readonly,
          'aria-describedby': hasError ? `${controlId}-validation-msg` : helpId,
          autoComplete,
          placeholder: type === 'date' ? 'dd/mm/yyyy' : placeholder,
        })}
        value={formattedValue ?? ''}
        onBlur={handleOnBlur}
        onChange={handleOnChange}
        onKeyDown={handleOnKeyDown}
        onClick={handleOnClick}
        onFocus={handleFocus}
        {...rest}
      />
      {hasError ? (
        <Form.Control.Feedback
          type='invalid'
          id={`${controlId}-validation-msg`}
          className='form-validation-message'
        >
          {_meta.error}
        </Form.Control.Feedback>
      ) : null}
    </Form.Group>
  );
};

export default TextInput;
