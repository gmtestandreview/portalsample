import { beforeEach, describe, expect, it, vi } from 'vitest';

const bridgeMocks = vi.hoisted(() => ({
  broadcastResponseToMainFrame: vi.fn(),
}));

vi.mock('@azure/msal-browser/redirect-bridge', () => bridgeMocks);

describe('MSAL redirect bridge entry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('broadcasts the authentication response', async () => {
    bridgeMocks.broadcastResponseToMainFrame.mockResolvedValue(undefined);

    await import('../../../ClientApp/src/authentication/redirectBridge');

    expect(bridgeMocks.broadcastResponseToMainFrame).toHaveBeenCalledTimes(1);
  });

  it('reports a sanitized constant when broadcasting fails', async () => {
    bridgeMocks.broadcastResponseToMainFrame.mockRejectedValue(
      new Error('token=must-not-be-logged')
    );
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await import('../../../ClientApp/src/authentication/redirectBridge');
    await vi.waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith('MSAL redirect bridge failed')
    );

    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('token=');
    consoleError.mockRestore();
  });
});
