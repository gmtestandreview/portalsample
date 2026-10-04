import { PatternFormatFixed } from '../Inputs/NumberInput/types';
import type { SummaryDisplayProps } from './types';
import { omitUndefined } from '../../utils/omitUndefined';

const renderEmptyValue = (className: string) => (
  <span className={className}>
    {'-'} <span className='visually-hidden'>No details added</span>
  </span>
);

const renderPhoneValue = (
  value: string,
  className: string,
  as: 'p' | 'span'
) => {
  const Tag = as === 'p' ? 'p' : 'span';
  return (
    <>
      <Tag className={`mb-0 text-break ${className}`} aria-hidden='true'>
        {value}
      </Tag>
      <Tag className='visually-hidden'>{value.split('').join(' ')}</Tag>
    </>
  );
};

const renderHiddenSpacedValue = (value: string) => (
  <span className='visually-hidden'>{value.split('').join(' ')}</span>
);

type FormattedValueOptions = Pick<
  SummaryDisplayProps,
  | 'format'
  | 'mask'
  | 'prefix'
  | 'suffix'
  | 'valueIsNumericString'
  | 'allowemptyformatting'
  | 'renderText'
>;

const renderFormattedValue = (
  value: string,
  className: string,
  {
    format,
    mask,
    prefix,
    suffix,
    valueIsNumericString,
    allowemptyformatting,
    renderText,
  }: FormattedValueOptions
) => (
  <>
    {format ? (
      <PatternFormatFixed
        className={className}
        displayType='text'
        value={value}
        format={format}
        {...omitUndefined({
          mask,
          prefix,
          suffix,
          valueIsNumericString,
          allowemptyformatting,
          renderText,
        })}
        aria-hidden='true'
      >
        {value}
      </PatternFormatFixed>
    ) : (
      <span className={className} aria-hidden='true'>
        {value}
      </span>
    )}
    {renderHiddenSpacedValue(value)}
  </>
);

const renderTextValue = (
  value: string,
  className: string,
  as: 'p' | 'span',
  isPhoneLabel: boolean
) => {
  if (isPhoneLabel) {
    return renderPhoneValue(value, className, as);
  }

  if (as === 'p') {
    return <p className={`mb-0 text-break ${className}`}>{value}</p>;
  }

  return <span className={`text-break ${className}`}>{value}</span>;
};

const SummaryDisplay = (props: Readonly<SummaryDisplayProps>) => {
  const {
    label,
    value,
    descriptor,
    as = 'span', // default props
    bodyText,
    containerClassName = '', // default props
    className = '', // default props
    format,
    mask,
    prefix,
    suffix,
    valueIsNumericString,
    allowemptyformatting,
    renderText,
  } = props;

  const labelText = typeof label === 'string' ? label : '';
  const isPhoneLabel = labelText.toLowerCase().includes('phone');

  const renderFieldValue = () => {
    if (!value) {
      return renderEmptyValue(className);
    }

    if (as === 'number' || format) {
      return renderFormattedValue(value, className, {
        format,
        mask,
        prefix,
        suffix,
        valueIsNumericString,
        allowemptyformatting,
        renderText,
      });
    }

    if (as === 'custom') {
      return <>{bodyText}</>;
    }

    if (as === 'p') {
      return renderTextValue(value, className, 'p', isPhoneLabel);
    }

    if (as === 'span') {
      return renderTextValue(value, className, 'span', isPhoneLabel);
    }

    return null;
  };

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <div className='form-label mb-0'>{label}</div>}
      {renderFieldValue()}
      {!!descriptor && (
        <>
          {' '}
          <br />
          <span className='text-break'>{descriptor}</span>
        </>
      )}
    </div>
  );
};

export default SummaryDisplay;
