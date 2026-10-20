import { useFormikContext } from 'formik';
import type { FormikValues, FormikErrors } from 'formik';
import capitalize from 'lodash/capitalize';
import startCase from 'lodash/startCase';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { useFormState } from 'react-hook-form';
import { Link } from 'react-router';
import type {
  ProblemDetails,
  ValidationProblemDetails,
} from '../../../api/web-api-client';
import type { ErrorSummaryProps, FormikErrorsSummaryProps } from './types';
import HashLink from '../../Utilities/hashLink';
import { HttpStatusCode } from '../../../types';
import { omitUndefined } from '../../../utils/omitUndefined';
import { useIsRhfShell } from '../RhfForm';
import { flattenRhfErrors } from './rhfErrors';

type ErrorData = Record<string, unknown> | readonly unknown[];
type FlatErrorData = Record<string, string>;

const isValidationProblemDetails = (
  value?: ProblemDetails | ValidationProblemDetails
): value is ValidationProblemDetails => value != null && 'errors' in value;

const handleAlertScroll = (): ReturnType<typeof setTimeout> =>
  setTimeout(() => {
    const summaryRef: HTMLElement = document.querySelector(
      '#form-error-summary'
    ) as HTMLElement;
    if (summaryRef && typeof summaryRef.scrollIntoView === 'function') {
      summaryRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    summaryRef?.focus();
  }, 100);

const renderErrorListItem = (
  key: string,
  text: string,
  disableLinkedError?: boolean
): JSX.Element => {
  if (disableLinkedError) {
    return (
      <li key={key}>
        <span className='text-danger fw-bold'>{text}</span>
      </li>
    );
  }

  return (
    <li key={key}>
      <HashLink to={`#${key}`} className='text-danger fw-bold'>
        {text}
      </HashLink>
    </li>
  );
};

const keyToSentenceCase = (key: string, depth?: number, separator = '.') => {
  const keyParts = key.split(separator);
  let sentenceBuilder = '';
  keyParts.forEach((keyPart, i) => {
    if (Number.isNaN(+keyPart)) {
      if ((depth && i < depth) || !depth) {
        sentenceBuilder = sentenceBuilder.concat(
          `${capitalize(startCase(keyPart))}: `
        );
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
        {Object.keys(errors).map((key) =>
          renderErrorListItem(
            key,
            `${keyToSentenceCase(key, 1)}${errors[key]}`,
            disableLinkedError
          )
        )}
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
      <span className='text-danger fw-bold'>{error}</span>
    </div>
  </Alert>
);

const sanitizeErrorData = (
  errorData: ErrorData,
  prefixToAdd: false | string = false,
  resultBuilder: FlatErrorData | null = null
): FlatErrorData => {
  const result: FlatErrorData = resultBuilder ?? {};

  const prefix = prefixToAdd === false ? '' : `${prefixToAdd}.`;

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
  prefixToRemove?: string
): FlatErrorData =>
  Object.entries(validationErrors).reduce<FlatErrorData>(
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
      keyBuilder = keyBuilder
        .split('.')
        .map((part) => `${part.charAt(0).toLowerCase()}${part.slice(1)}`) // lowercase first letter of each subkey
        .join('.');
      result[keyBuilder] = message;
      return result;
    },
    {}
  );

interface SummaryFocusState {
  hasErrors: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  submitCount: number;
}

// Move focus to the summary once per failed submit attempt, after validation
// has settled. The timer is only cleared on unmount: clearing it when the
// dependencies change would cancel the focus as soon as `isSubmitting` flips.
const useFocusSummaryOnFailedSubmit = ({
  hasErrors,
  isSubmitting,
  isValidating,
  submitCount,
}: SummaryFocusState) => {
  const focusedSubmitCount = useRef(0);
  const focusTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  useEffect(() => {
    if (
      isSubmitting ||
      isValidating ||
      !hasErrors ||
      submitCount === focusedSubmitCount.current
    ) {
      return;
    }
    focusedSubmitCount.current = submitCount;
    focusTimeout.current = handleAlertScroll();
  }, [hasErrors, isSubmitting, isValidating, submitCount]);

  useEffect(() => () => clearTimeout(focusTimeout.current), []);
};

const FormikErrorsSummary = ({
  disableLinkedError,
}: FormikErrorsSummaryProps) => {
  const { errors, submitCount, isValidating, isSubmitting } =
    useFormikContext<FormikValues>();
  const [errorSummary, setErrorSummary] = useState<FormikErrors<FormikValues>>(
    {}
  );
  const sanitizedErrorSummary = sanitizeErrorData(errorSummary);
  const hasErrors = Object.keys(sanitizedErrorSummary).length > 0;

  useEffect(() => {
    if (submitCount > 0) {
      setErrorSummary(errors);
    }
  }, [errors, submitCount]);

  useFocusSummaryOnFailedSubmit({
    hasErrors,
    isSubmitting,
    isValidating,
    submitCount,
  });

  if (!hasErrors) {
    return null;
  }
  return renderErrors(sanitizedErrorSummary, disableLinkedError);
};

/**
 * RHF counterpart of `FormikErrorsSummary`. Errors are shown once the form has
 * been submitted; before that they only mark their fields. The messages are
 * read through `flattenRhfErrors`, which never touches the DOM `ref` RHF keeps
 * on each error. Focus is not moved to a field (`shouldFocusError: false`), so
 * the summary alone takes it.
 */
const RhfErrorsSummary = ({ disableLinkedError }: FormikErrorsSummaryProps) => {
  const { errors, submitCount, isValidating, isSubmitting } = useFormState();
  const flatErrors = submitCount > 0 ? flattenRhfErrors(errors) : {};
  const hasErrors = Object.keys(flatErrors).length > 0;

  useFocusSummaryOnFailedSubmit({
    hasErrors,
    isSubmitting,
    isValidating,
    submitCount,
  });

  if (!hasErrors) {
    return null;
  }
  return renderErrors(flatErrors, disableLinkedError);
};

const ErrorSummary = ({
  serverErrors,
  prefixToRemove,
  disableLinkedError,
  isWafViolation,
}: Readonly<ErrorSummaryProps>) => {
  const isRhfShell = useIsRhfShell();
  useEffect(() => {
    if (serverErrors) {
      const timeoutId = handleAlertScroll();
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [serverErrors]);
  if (isValidationProblemDetails(serverErrors)) {
    const { errors: validationErrors } = serverErrors;
    if (validationErrors) {
      return renderErrors(
        sanitizeErrorData(
          formatServerErrorKeys(validationErrors, prefixToRemove)
        ),
        disableLinkedError
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
          Please avoid special characters and where possible use only letters,
          numbers, comma and period separators before trying again.
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
            Another person has already saved this page. Your changes have not
            been saved.
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
            We are unable to process your request. Your changes have not been
            saved. Please contact support.
          </p>
        );
        break;
      default:
        error = <p className='fw-bold'>Server error</p>;
        break;
    }

    return renderServerError(error);
  }

  const Summary = isRhfShell ? RhfErrorsSummary : FormikErrorsSummary;
  return <Summary {...omitUndefined({ disableLinkedError })} />;
};

export default ErrorSummary;
