import { orIfEmpty } from '../../../utils/orIfEmpty';
import Form from 'react-bootstrap/Form';
import { useField } from 'formik';
import type { ReactNode } from 'react';
import SummaryDisplay from '../../SummaryDisplay';
import Details from '../../forms/Details';
import { omitUndefined } from '../../../utils/omitUndefined';
import { getControlId } from '../getControlId';

export interface TextReadOnlyProps {
  label: string;
  name: string;
  id?: string;
  type?: string;
  containerClassName?: string;
  className?: string;
  value?: string;
  as?: string;
  format?: string | FormatInputValueFunction;
  mask?: string | string[];
  prefix?: string;
  suffix?: string;
  thousandSeparator?: boolean | string;
  valueIsNumericString?: boolean;
  allowNegative?: boolean;
  allowemptyformatting?: boolean;
  allowLeadingZeros?: boolean;
  renderText?: (formattedValue: string) => React.ReactNode;
  allowedDecimalSeparators?: string[];
  isSummary?: boolean | undefined;
  inlineHelpTitle?: string;
  inlineHelp?: string | ReactNode;
}

export type FormatInputValueFunction = (inputValue: string) => string;

const TextReadOnly = (props: Readonly<TextReadOnlyProps>) => {
  const {
    label,
    name,
    id,
    type,
    containerClassName = '', // default props
    className = '', // default props
    value,
    as = 'span', // default props
    format = '', // default props
    mask,
    prefix,
    suffix,
    thousandSeparator,
    valueIsNumericString,
    allowNegative,
    allowemptyformatting,
    allowLeadingZeros,
    renderText,
    allowedDecimalSeparators,
    isSummary,
    inlineHelp,
    inlineHelpTitle,
  } = props;
  const [_field, _meta] = useField(name);
  const controlId = getControlId(id, name);
  const hasInlineHelp = Boolean(inlineHelp);
  const hasInlineHelpTitle = Boolean(inlineHelpTitle);
  const helpId = hasInlineHelp ? `help-${controlId}` : undefined;
  const fieldValue = typeof _field.value === 'string' ? _field.value : '';

  if (isSummary) {
    return (
      <SummaryDisplay
        label={label}
        value={fieldValue}
        as={as}
        id={controlId}
        format={format}
        mask={mask}
        prefix={prefix}
        suffix={suffix}
        thousandSeparator={thousandSeparator}
        valueIsNumericString={valueIsNumericString}
        allowNegative={allowNegative}
        allowemptyformatting={allowemptyformatting}
        allowLeadingZeros={allowLeadingZeros}
        renderText={renderText}
        allowedDecimalSeparators={allowedDecimalSeparators}
      />
    );
  }
  return (
    <Form.Group
      className={`form-field-container ${containerClassName}`}
      controlId={controlId}
    >
      <Form.Label className={hasInlineHelp ? 'pb-0' : ''}>{label}</Form.Label>
      {hasInlineHelp && !hasInlineHelpTitle ? (
        <Form.Text as='p' id={helpId} className='contextual-help text-muted'>
          {inlineHelp}
        </Form.Text>
      ) : null}
      {hasInlineHelp && hasInlineHelpTitle ? (
        <Details
          {...omitUndefined({ id: helpId })}
          title={inlineHelpTitle}
          inlineHelp={inlineHelp}
        />
      ) : null}
      <Form.Control
        className={`form-field form-text-input-read ${className}`}
        type={type ?? 'text'}
        name={name}
        readOnly
        value={orIfEmpty(value, fieldValue)}
      />
    </Form.Group>
  );
};

export default TextReadOnly;
