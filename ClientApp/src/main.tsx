import { PublicClientApplication } from '@azure/msal-browser';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { StrictMode } from 'react';
import AccountProvider from './authentication/AccountProvider';
import { configuration } from './authentication/authConfig';
import App from './App';
import { TrustedTypes } from './trustedtypes';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);
const pca =
  await PublicClientApplication.createPublicClientApplication(configuration);
TrustedTypes.createTrustedTypePolicy();

root.render(
  <MsalProvider instance={pca}>
    <AccountProvider>
      <StrictMode>
        <RouterProvider router={App} />
      </StrictMode>
    </AccountProvider>
  </MsalProvider>,
);
