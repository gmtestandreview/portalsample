import { useField } from 'formik';
import type { FieldHookConfig } from 'formik';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Checkbox from '../Checkbox';
import type { CheckboxGroupProps } from './types';
import Details from '../../forms/Details';
import SummaryDisplay from '../../SummaryDisplay';

const CheckboxGroup = <T,>(props: CheckboxGroupProps<T> & FieldHookConfig<T>) => {
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
        containerClassName = '', // default props
        legendClassName = '', // default props
        className = '', // default props
        subFormField,
        supressFieldLevelMessages,
        ...rest
    } = props;

    const helpId = inlineHelp ? `help-${id || name}` : undefined;
    const legendId = `${id || name}`;
    const [_field, _meta] = useField<T>(name);

    if (isSummary) {
        if (_field && _field.value) {
            const currentFieldIndex = options.findIndex((x) => x.value === _field.value);
            const summaryLabel = currentFieldIndex !== -1 ? options[currentFieldIndex].label : '';

            if (currentFieldIndex < 0) {
                return null;
            }
            return (
                <SummaryDisplay
                    label={legend}
                    value={summaryLabel}
                    id={id || name}
                    as='span'
                    containerClassName={containerClassName}
                    className={className}
                />
            );
        }

        return null;
    }

    return (
        <fieldset
            data-testid={`fs-${legendId}`}
            aria-describedby={
                _meta.touched && _meta.error
                    ? `${id || name}-validation-msg`
                    : (helpId || undefined)
            }
        >
            <legend id={legendId} className={legendClassName}>{legend}</legend>
            <Form.Group id={name} className={`form-field-container ${containerClassName}`} tabIndex={-1}>
                {inlineHelp && !inlineHelpTitle
          && (
              <Form.Text as='p' id={helpId} className='contextual-help'>
                  {inlineHelp}
              </Form.Text>
          )}
                {inlineHelp && inlineHelpTitle
          && (
              <Details id={helpId} title={inlineHelpTitle} inlineHelp={inlineHelp} />
          )}
                {displayHorizontally
                    ? (
                        <Row>
                            {options.map((option) => (
                                <Col key={`${option.value}`}>
                                    <Checkbox
                                        name={name}
                                        onChange={onChange}
                                        containerClassName='mb-0'
                                        className={className}
                                        subFormField={subFormField}
                                        supressFieldLevelMessages={supressFieldLevelMessages}
                                        {...option}
                                        {...(rest as any)}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )
                    : (
                        options.map((option) => (
                            <Checkbox
                                key={`${option.value}`}
                                name={name}
                                onChange={onChange}
                                containerClassName='mb-0'
                                className={className}
                                subFormField={subFormField}
                                supressFieldLevelMessages={supressFieldLevelMessages}
                                {...option}
                                {...(rest as any)}
                            />
                        ))
                    )}
                {_meta.touched && _meta.error
                    ? (
                        <Form.Control.Feedback type='invalid' id={`${id || name}-validation-msg`} className='form-validation-message'>
                            {_meta.error}
                        </Form.Control.Feedback>
                    )
                    : null}
            </Form.Group>
        </fieldset>
    );
};

// CheckboxGroup.defaultProps = {
//     containerClassName: '',
//     className: '',
// };

export default CheckboxGroup;
