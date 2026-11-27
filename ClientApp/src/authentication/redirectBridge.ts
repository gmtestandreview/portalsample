import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

try {
  await broadcastResponseToMainFrame();
} catch {
  console.error('MSAL redirect bridge failed');
}
