import { useFormikContext } from 'formik';
import type { FormikValues, FormikErrors } from 'formik';
import {
    map, startCase, capitalize,
} from 'lodash';
import { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { Link } from 'react-router';
import type { ProblemDetails, ValidationProblemDetails } from '../../../api/web-api-client';
import type { ErrorSummaryProps, FormikErrorsSummaryProps } from './types';
import HashLink from '../../Utilities/hashLink';
import { HttpStatusCode } from '../../../types';

type ErrorData = Record<string, unknown> | readonly unknown[];
type FlatErrorData = Record<string, string>;

const isValidationProblemDetails = (
    value?: ProblemDetails | ValidationProblemDetails,
)
: value is ValidationProblemDetails => value != null && 'errors' in value;

const handleAlertScroll = () => {
    setTimeout(() => {
        const summaryRef: HTMLElement = document.querySelector('#form-error-summary') as HTMLElement;
        if (summaryRef && typeof summaryRef.scrollIntoView === 'function') {
            summaryRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        summaryRef?.focus();
    }, 100);
};

const renderErrorListItem = (
    key: string,
    text: string,
    disableLinkedError?: boolean,
): JSX.Element => {
    if (disableLinkedError) {
        handleAlertScroll();
        return (
            <li key={key}>
                <span className='text-danger fw-bold'>{text}</span>
            </li>
        );
    }

    return (
        <li key={key}>
            <HashLink
                to={`#${key}`}
                className='text-danger fw-bold'
            >
                {text}
            </HashLink>
        </li>
    );
};

const keyToSentenceCase = (key: string, depth?: number, separator = '.') => {
    const keyParts = key.split(separator);
    let sentenceBuilder = '';
    map(keyParts, (keyPart, i) => {
        if (Number.isNaN(+keyPart)) {
            if ((depth && i < depth) || !depth) {
                sentenceBuilder = sentenceBuilder.concat(`${capitalize(startCase(keyPart))}: `);
            }
        } else {
            sentenceBuilder = sentenceBuilder.concat(`(#${+keyPart + 1}): `);
        }
    });
    return sentenceBuilder;
};

const renderErrors = (errors: FlatErrorData, disableLinkedError?: boolean) => (
    <Alert
        variant='danger'
        role='alert'
        aria-live='assertive'
        id='form-error-summary'
        data-testid='form-error-summary'
        className='d-flex'
        tabIndex={-1}
    >
        <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
            <div className='bgCircle me-3'>
                <i className='icon-warning' aria-hidden='true' />
            </div>
        </div>
        <div>
            <Alert.Heading as='h2' className='h5 fw-normal'>
                The following issue(s) must be corrected before you can continue:
            </Alert.Heading>
            <ul>
                {
                    map(Object.keys(errors), (key) => (
                        renderErrorListItem(key, `${keyToSentenceCase(key, 1)}${errors[key]}`, disableLinkedError)
                    ))
                }
            </ul>
        </div>
    </Alert>
);

const renderServerError = (error: string | JSX.Element) => (
    <Alert
        variant='danger'
        role='alert'
        aria-live='assertive'
        id='form-error-summary'
        data-testid='form-error-summary'
        className='d-flex'
        tabIndex={-1}
    >
        <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
            <div className='bgCircle me-3'>
                <i className='icon-warning' aria-hidden='true' />
            </div>
        </div>
        <div>
            <span className='text-danger fw-bold'>
                {error}
            </span>
        </div>
    </Alert>
);

const sanitizeErrorData = (
    errorData: ErrorData,
    prefixToAdd: false | string = false,
    resultBuilder: FlatErrorData | null = null,
): FlatErrorData => {
    const result: FlatErrorData = resultBuilder ?? {};

    const prefix = prefixToAdd === false
        ? ''
        : `${prefixToAdd}.`;

    Object.entries(errorData).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            sanitizeErrorData(value as ErrorData, prefix + key, result);
        } else if (typeof value === 'string') {
            result[prefix + key] = value;
        }
    });
    return result;
};

const formatServerErrorKeys = (
    validationErrors: Record<string, string[]>,
    prefixToRemove?: string,
): FlatErrorData => Object.entries(validationErrors).reduce<FlatErrorData>(
    (result, [key, messages]) => {
        const message = messages[0];
        if (message === undefined) {
            return result;
        }

        let keyBuilder = key;
        if (prefixToRemove) {
            keyBuilder = keyBuilder.replace(prefixToRemove, ''); // strip out server dto prefix
        }

        keyBuilder = keyBuilder.replaceAll('[', '.').replaceAll(']', ''); // remove array braces
        keyBuilder = map(
            keyBuilder.split('.'),
            (part) => `${part.charAt(0).toLowerCase()}${part.slice(1)}`, // lowercase first letter of each subkey
        ).join('.');
        result[keyBuilder] = message;
        return result;
    },
    {},
);

const FormikErrorsSummary = ({ disableLinkedError }: FormikErrorsSummaryProps) => {
    const {
        errors, submitCount, isValidating, isSubmitting,
    } = useFormikContext<FormikValues>();
    const [errorSummary, setErrorSummary] = useState<FormikErrors<FormikValues>>({});
    const sanitizedErrorSummary = sanitizeErrorData(errorSummary);
    const hasErrors = Object.keys(sanitizedErrorSummary).length > 0;

    useEffect(() => {
        if (submitCount > 0) {
            setErrorSummary(errors);
        }
        if (isSubmitting && !isValidating && hasErrors) {
            handleAlertScroll();
        }
    }, [errors, submitCount, isValidating, isSubmitting, hasErrors]);

    if (!hasErrors) {
        return null;
    }
    return renderErrors(sanitizedErrorSummary, disableLinkedError);
};

const ErrorSummary = ({
    serverErrors, prefixToRemove, disableLinkedError, isWafViolation,
}: ErrorSummaryProps) => {
    useEffect(() => {
        if (serverErrors) {
            handleAlertScroll();
        }
    }, [serverErrors]);
    if (isValidationProblemDetails(serverErrors)) {
        const { errors: validationErrors } = serverErrors;
        if (validationErrors) {
            return renderErrors(
                sanitizeErrorData(
                    formatServerErrorKeys(validationErrors, prefixToRemove),
                ),
                disableLinkedError,
            );
        }
    }

    // 499252 catch waf violations and handle gracefully
    if (isWafViolation) {
        const error = (
            <>
                <p className='fw-bold'>
                    An error has occurred. This form contains invalid characters.
                </p>
                <p className='mb-0'>
                    Please avoid special characters and where possible use only letters, numbers, comma and period separators before trying again.
                </p>
            </>
        );
        return renderServerError(error);
    }

    if (serverErrors) {
        let error;
        switch (serverErrors.status) {
            case HttpStatusCode.Conflict:
                error = (
                    <p className='fw-bold'>
                        Another person has already saved this page.
                        Your changes have not been saved.
                    </p>
                );
                break;
            case HttpStatusCode.UnprocessableEntity:
                error = (
                    <p className='fw-bold'>
                        Another person has already submitted this form. Please
                        <Link to='/dashboard'> go to the Dashboard </Link>
                        to view the submitted form.
                    </p>
                );
                break;
            case HttpStatusCode.Forbidden:
                error = (
                    <p className='fw-bold'>
                        We are unable to process your request. Your changes have not been saved. Please contact support.
                    </p>
                );
                break;
            default:
                error = (
                    <p className='fw-bold'>
                        Server error
                    </p>
                );
                break;
        }

        return renderServerError(error);
    }

    return <FormikErrorsSummary disableLinkedError={disableLinkedError} />;
};

export default ErrorSummary;
