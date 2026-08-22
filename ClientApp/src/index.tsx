import { PublicClientApplication } from '@azure/msal-browser';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { MsalProvider } from '@azure/msal-react';
import AccountProvider from './authentication/AccountProvider';
import { configuration } from './authentication/authConfig';
import App from './App';
import { TrustedTypes } from './trustedtypes';
import ErrorBoundary from './components/ErrorBoundary';
import { ai } from './instrumentation/AppInsightsService';
import type { ReactPlugin } from '@microsoft/applicationinsights-react-js';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);
const pca = await PublicClientApplication.createPublicClientApplication(configuration);
TrustedTypes.createTrustedTypePolicy();

root.render(
    <ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
        <MsalProvider instance={pca}>
            <AccountProvider>
                <StrictMode>
                    <RouterProvider router={App} />
                </StrictMode>
            </AccountProvider>
        </MsalProvider>
    </ErrorBoundary>,
);
