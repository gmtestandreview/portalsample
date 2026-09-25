import { useField } from 'formik';
import type { FieldHookConfig } from 'formik';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import RadioButton from '../RadioButton';
import type { RadioButtonGroupProps } from './types';
import Details from '../../forms/Details';
import SummaryDisplay from '../../SummaryDisplay';

const RadioButtonGroup = <T,>(props: RadioButtonGroupProps<T> & FieldHookConfig<T>) => {
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
        className = '', // default props
        subFormField,
        ...rest
    } = props;

    const helpId = inlineHelp ? `help-${id || name}` : undefined;
    const legendId = `${id || name}`;
    const [field, meta] = useField(name);

    if (isSummary) {
        if (field?.value) {
            const selectedOption = options.find((option) => option.value === field.value);
            return (
                <SummaryDisplay
                    label={legend}
                    value={selectedOption?.label ?? 'No details added'}
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
                meta.touched && meta.error
                    ? `${id || name}-validation-msg`
                    : (helpId || undefined)
            }
        >
            <legend id={legendId}>{legend}</legend>
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
                                    <RadioButton
                                        name={name}
                                        onChange={onChange}
                                        subFormField={subFormField}
                                        {...option}
                                        {...rest}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )
                    : (
                        options.map((option) => (
                            <RadioButton
                                key={`${option.value}`}
                                name={name}
                                onChange={onChange}
                                subFormField={subFormField}
                                {...option}
                                {...rest}
                            />
                        ))
                    )}
                {meta.touched && meta.error
                    ? (
                        <Form.Control.Feedback type='invalid' id={`${id || name}-validation-msg`} className='form-validation-message'>
                            {meta.error}
                        </Form.Control.Feedback>
                    )
                    : null}
            </Form.Group>
        </fieldset>
    );
};

export default RadioButtonGroup;
