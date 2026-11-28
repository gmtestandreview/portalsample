import { createStandardPublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import AccountProvider from './authentication/AccountProvider';
import { configuration } from './authentication/authConfig';
import ErrorBoundary from './components/ErrorBoundary';
import { ai } from './instrumentation/AppInsightsService';
import { TrustedTypes } from './trustedtypes';

const pca = await createStandardPublicClientApplication(configuration);
TrustedTypes.createTrustedTypePolicy();

hydrateRoot(
  document,
  <StrictMode>
    <ErrorBoundary appInsights={ai.reactPlugin}>
      <MsalProvider instance={pca}>
        <AccountProvider>
          <HydratedRouter />
        </AccountProvider>
      </MsalProvider>
    </ErrorBoundary>
  </StrictMode>,
);
