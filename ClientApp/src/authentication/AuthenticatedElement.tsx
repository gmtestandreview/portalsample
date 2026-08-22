import { InteractionType } from '@azure/msal-browser';
import { MsalAuthenticationTemplate, useMsal } from '@azure/msal-react';
import { isRouteErrorResponse, Navigate, useRouteError } from 'react-router';
import type { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { authRequest } from './authConfig';
import type { AuthenticatedElementProps } from './types';
import BlockUISpinner from '../components/BlockUISpinner';
import PreConditions from '../routes/preConditions/PreConditions';
import ErrorBoundary from '../components/ErrorBoundary';
import { ai } from '../instrumentation/AppInsightsService';

const Loading = () => <BlockUISpinner><p>Logging in...</p></BlockUISpinner>;

const RedirectToHome = () => {
    const { instance } = useMsal();
    const error = useRouteError();
    if (isRouteErrorResponse(error)) {
        instance.setActiveAccount(null);
        return error.status === 404 ? <Navigate to='/not-found' /> : <Navigate to='/server-error' />;
    }

    instance.setActiveAccount(null);
    return <Navigate to='/' />;
};

const AuthenticatedElement = ({ children, displayHeaderAndFooter = true }: AuthenticatedElementProps) => (
    <PreConditions displayHeaderAndFooter={displayHeaderAndFooter}>
        <MsalAuthenticationTemplate
            interactionType={InteractionType.Redirect}
            authenticationRequest={authRequest}
            loadingComponent={Loading}
            errorComponent={RedirectToHome}
        >
            <ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
                {children}
            </ErrorBoundary>
        </MsalAuthenticationTemplate>
    </PreConditions>
);

export default AuthenticatedElement;
