import * as msalBrowser from '@azure/msal-browser';
import * as msalReact from '@azure/msal-react';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';
import { describe, expect, it } from 'vitest';

describe('MSAL v5 package compatibility', () => {
  it('exposes the v5 bootstrap and redirect bridge contracts used by the app', () => {
    expect.hasAssertions();

    expect(msalBrowser.createStandardPublicClientApplication).toStrictEqual(
      expect.any(Function),
    );
    expect(msalBrowser.PublicClientApplication).toBeDefined();
    expect(broadcastResponseToMainFrame).toStrictEqual(expect.any(Function));
    expect(msalReact.MsalProvider).toStrictEqual(expect.any(Function));
  });
});
