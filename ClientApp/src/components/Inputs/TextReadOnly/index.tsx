import Form from 'react-bootstrap/Form';
import { useField } from 'formik';
import type { ReactNode } from 'react';
import SummaryDisplay from '../../SummaryDisplay';
import Details from '../../forms/Details';

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
    allowedDecimalSeparators?: Array<string>;
    isSummary?: boolean;
    inlineHelpTitle?: string;
    inlineHelp?: string | ReactNode;
}

export type FormatInputValueFunction = (inputValue: string) => string;

const TextReadOnly = ({
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
}: TextReadOnlyProps) => {
    const [_field, _meta] = useField(name);
    const helpId = inlineHelp ? `help-${id || name}` : undefined;

    if (isSummary) {
        return (
            <SummaryDisplay
                label={label}
                value={_field.value}
                as={as}
                id={id || name}
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
        <Form.Group className={`form-field-container ${containerClassName}`} controlId={id || name}>
            <Form.Label className={inlineHelp ? 'pb-0' : ''}>{label}</Form.Label>
            {inlineHelp && !inlineHelpTitle
      && (
          <Form.Text as='p' id={helpId} className='contextual-help text-muted'>
              {inlineHelp}
          </Form.Text>
      )}
            {inlineHelp && inlineHelpTitle
      && (
          <Details id={helpId} title={inlineHelpTitle} inlineHelp={inlineHelp} />
      )}
            <Form.Control
                className={`form-field form-text-input-read ${className}`}
                type={type || 'text'}
                name={name}
                readOnly
                value={value || _field.value}
            />
        </Form.Group>
    );
};

export default TextReadOnly;
