import * as msalBrowser from '@azure/msal-browser';
import * as msalReact from '@azure/msal-react';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';
import { describe, expect, it } from 'vitest';

describe('mSAL v5 package compatibility', () => {
  it('exposes the v5 bootstrap and redirect bridge contracts used by the app', () => {
    expect(msalBrowser.createStandardPublicClientApplication).toEqual(
      expect.any(Function)
    );
    expect(msalBrowser.PublicClientApplication).toBeDefined();
    expect(broadcastResponseToMainFrame).toEqual(expect.any(Function));
    expect(msalReact.MsalProvider).toEqual(expect.any(Function));
  });
});
