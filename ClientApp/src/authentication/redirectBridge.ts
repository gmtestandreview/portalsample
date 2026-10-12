import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

void broadcastResponseToMainFrame().catch(() => {
  console.error('MSAL redirect bridge failed');
});
