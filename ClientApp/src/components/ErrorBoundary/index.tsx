import type { ReactNode } from 'react';
import { SeverityLevel } from '@microsoft/applicationinsights-common';
import type { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import type { ProblemDetails } from '../../api/web-api-client';
import ErrorDisplay from './ErrorDisplay';
import { HttpStatusCode } from '../../types';

export interface ErrorBoundaryProps {
    appInsights: ReactPlugin;
    children: ReactNode;
}

const ErrorFallback = ({ error }: FallbackProps) => {
    const details = error as ProblemDetails;
    const status = details.status ?? HttpStatusCode.InternalServerError;
    return <ErrorDisplay status={status} />;
};

const ErrorBoundary = ({ appInsights, children }: ErrorBoundaryProps) => (
    <ReactErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={(error, info) => {
            appInsights.getAppInsights().trackException({
                error,
                exception: error,
                severityLevel: SeverityLevel.Error,
                properties: { ...info },
            });
        }}
    >
        {children}
    </ReactErrorBoundary>
);

export default ErrorBoundary;
