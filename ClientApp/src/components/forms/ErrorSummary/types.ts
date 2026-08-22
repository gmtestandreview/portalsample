import type { ReactNode } from 'react';
import type { ProblemDetails, ValidationProblemDetails } from '../../../api/web-api-client';

export interface FormikErrorsSummaryProps {
    disableLinkedError?: boolean;
}

export interface ErrorSummaryProps extends FormikErrorsSummaryProps {
    serverErrors?: ProblemDetails | ValidationProblemDetails;
    prefixToRemove?: string;
    isWafViolation?: boolean;
    children?: ReactNode;
}
