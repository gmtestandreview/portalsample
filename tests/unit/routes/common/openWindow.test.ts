import { describe, it, expect, vi } from 'vitest';
import {
  openInternalRouteInNewTab,
  openPdfPageInSecureNewTab,
  openUrlInSecureNewTab,
} from '../../../../ClientApp/src/routes/common/openWindow';

describe('openWindow helpers', () => {
  const originalOpen = globalThis.open;

  const resetOpenWindowState = () => {
    globalThis.open = originalOpen;
    vi.restoreAllMocks();
  };

  it('opens internal routes with noopener,noreferrer and clears opener fallback', () => {
    expect.hasAssertions();

    resetOpenWindowState();

    const openedWindow = { opener: {} } as Window;
    const open = vi
      .fn<(...args: unknown[]) => unknown>()
      .mockReturnValue(openedWindow);
    globalThis.open = open as typeof globalThis.open;

    openInternalRouteInNewTab('/request-for-quote/123/view-summary');

    expect(open).toHaveBeenCalledWith(
      '/request-for-quote/123/view-summary',
      '_blank',
      'noopener,noreferrer',
    );
    expect(openedWindow.opener).toBeNull();
  });

  it('does not open external or protocol-relative routes through internal route helper', () => {
    expect.hasAssertions();

    resetOpenWindowState();

    const open = vi.fn<(...args: unknown[]) => unknown>();
    globalThis.open = open as typeof globalThis.open;

    openInternalRouteInNewTab('https://example.test/request');
    openInternalRouteInNewTab('//example.test/request');
    openInternalRouteInNewTab('javascript:alert(1)');

    expect(open).not.toHaveBeenCalled();
  });

  it('encodes PDF page fragments before opening the URL', () => {
    expect.hasAssertions();

    resetOpenWindowState();

    const open = vi.fn<(...args: unknown[]) => unknown>().mockReturnValue(null);
    globalThis.open = open as typeof globalThis.open;

    openPdfPageInSecureNewTab(
      'blob:https://portal.measurement.gov.au/pdf-id',
      '2&evil=1',
    );

    expect(open).toHaveBeenCalledWith(
      'blob:https://portal.measurement.gov.au/pdf-id#page=2%26evil%3D1',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('opens blob URLs with secure features', () => {
    expect.hasAssertions();

    resetOpenWindowState();

    const open = vi.fn<(...args: unknown[]) => unknown>().mockReturnValue(null);
    globalThis.open = open as typeof globalThis.open;

    openUrlInSecureNewTab('blob:https://portal.measurement.gov.au/pdf-id');

    expect(open).toHaveBeenCalledWith(
      'blob:https://portal.measurement.gov.au/pdf-id',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
