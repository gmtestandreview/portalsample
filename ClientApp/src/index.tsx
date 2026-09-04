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

// StrictMode is outermost so its development-only checks cover the MSAL and
// account providers, not just the router. ErrorBoundary sits inside it
// deliberately: its only side effect (trackException) runs from componentDidCatch,
// a commit-phase lifecycle, so StrictMode's double-render cannot double-report an
// exception. StrictMode emits nothing in a production build.
root.render(
    <StrictMode>
        <ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
            <MsalProvider instance={pca}>
                <AccountProvider>
                    <RouterProvider router={App} />
                </AccountProvider>
            </MsalProvider>
        </ErrorBoundary>
    </StrictMode>,
);
