import { useField } from 'formik';
import type { ChangeEvent } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import Details from '../../forms/Details';
import SummaryDisplay from '../../SummaryDisplay';
import TextReadOnly from '../TextReadOnly';
import type { SelectInputOption, SelectInputProps } from './types';

const hasSelectedValue = (value: unknown) => value !== undefined && value !== null && value !== '';

const getSelectedDisplayText = <T extends string | number>(
    value: unknown,
    options?: SelectInputOption<T>[],
) => options?.find((option) => option.value === value)?.displayText ?? '';

const renderInlineHelp = (
    helpId: string | undefined,
    inlineHelp: SelectInputProps['inlineHelp'],
    inlineHelpTitle: string | undefined,
) => {
    if (!inlineHelp) {
        return null;
    }

    if (inlineHelpTitle) {
        return <Details id={helpId} title={inlineHelpTitle} inlineHelp={inlineHelp} />;
    }

    return (
        <Form.Text as='p' id={helpId} className='contextual-help text-muted'>
            {inlineHelp}
        </Form.Text>
    );
};

const SelectInput = <T extends string | number>(selectInputProps: SelectInputProps<T>) => {
    const {
        displayHorizontally,
        label,
        inlineHelp = undefined, // default props
        inlineHelpTitle,
        options,
        defaultValue = '', // default props
        defaultDisplayText,
        className = '', // default props
        containerClassName = '', // default props
        name,
        id,
        disabled,
        onChange,
        isSummary,
        readOnly,
        addBlank,
    } = selectInputProps;

    const [field, meta] = useField(name);
    const controlId = id || name;
    const helpId = inlineHelp ? `help-${controlId}` : undefined;
    const selectedDisplayText = getSelectedDisplayText(field.value, options);
    const validationMessageId = `${controlId}-validation-msg`;
    const describedBy = meta.touched && meta.error ? validationMessageId : helpId;

    const defaultUIOption = (
        <option
            value={defaultValue}
            key={defaultValue}
            hidden={false}
        >
            {defaultDisplayText || 'Please select'}
        </option>
    );

    if (isSummary) {
        return hasSelectedValue(field.value)
            ? (
                <SummaryDisplay
                    label={label}
                    id={controlId}
                    as='p'
                    value={selectedDisplayText}
                />
            )
            : null;
    }

    if (readOnly === true) {
        return (
            <TextReadOnly
                label={label}
                name={name}
                inlineHelp={inlineHelp}
                inlineHelpTitle={inlineHelpTitle}
                value={selectedDisplayText}
            />
        );
    }

    const onSelectChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (onChange !== undefined) {
            onChange(event);
        }
        field.onChange(event);
    };

    const selectControl = (
        <>
            <Form.Control
                key={name}
                as='select'
                disabled={disabled}
                className={`form-field form-select ${className}`}
                {...field}
                onChange={(event) => onSelectChange(event as ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
                isInvalid={!!(meta.touched && meta.error)}
                aria-describedby={describedBy}
            >
                {addBlank && defaultUIOption}
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
            {meta.touched && meta.error
                ? (
                    <Form.Control.Feedback type='invalid' id={validationMessageId}>
                        {meta.error}
                    </Form.Control.Feedback>
                )
                : null}
        </>
    );

    return (
        <Form.Group controlId={controlId} className='form-field-container'>
            {displayHorizontally
                ? (
                    <Row>
                        <Col md={6} className='align-self-top align-self-md-center'>
                            <Form.Label className={inlineHelp ? 'pb-0' : ''}>{label}</Form.Label>
                            {renderInlineHelp(helpId, inlineHelp, inlineHelpTitle)}
                        </Col>
                        <Col md={6}>
                            <div className={`d-grid gap-2 d-flex justify-content-start justify-content-md-end ${containerClassName}`}>
                                {selectControl}
                            </div>
                        </Col>
                    </Row>
                )
                : (
                    <>
                        <Form.Label>{label}</Form.Label>
                        {renderInlineHelp(helpId, inlineHelp, inlineHelpTitle)}
                        <div className={`d-grid gap-2 ${containerClassName}`}>
                            {selectControl}
                        </div>
                    </>
                )}
        </Form.Group>
    );
};

export default SelectInput;
