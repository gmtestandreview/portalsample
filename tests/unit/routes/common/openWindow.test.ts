import {
    openInternalRouteInNewTab,
    openPdfPageInSecureNewTab,
    openUrlInSecureNewTab,
} from '../../../../ClientApp/src/routes/common/openWindow';

describe('openWindow helpers', () => {
    const originalOpen = globalThis.open;

    afterEach(() => {
        globalThis.open = originalOpen;
        vi.restoreAllMocks();
    });

    it('opens internal routes with noopener,noreferrer and clears opener fallback', () => {
        const openedWindow = { opener: {} } as Window;
        const open = vi.fn().mockReturnValue(openedWindow);
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
        const open = vi.fn();
        globalThis.open = open as typeof globalThis.open;

        openInternalRouteInNewTab('https://example.test/request');
        openInternalRouteInNewTab('//example.test/request');
        openInternalRouteInNewTab('javascript:alert(1)');

        expect(open).not.toHaveBeenCalled();
    });

    it('encodes PDF page fragments before opening the URL', () => {
        const open = vi.fn().mockReturnValue(null);
        globalThis.open = open as typeof globalThis.open;

        openPdfPageInSecureNewTab('blob:https://portal.measurement.gov.au/pdf-id', '2&evil=1');

        expect(open).toHaveBeenCalledWith(
            'blob:https://portal.measurement.gov.au/pdf-id#page=2%26evil%3D1',
            '_blank',
            'noopener,noreferrer',
        );
    });

    it('opens blob URLs with secure features', () => {
        const open = vi.fn().mockReturnValue(null);
        globalThis.open = open as typeof globalThis.open;

        openUrlInSecureNewTab('blob:https://portal.measurement.gov.au/pdf-id');

        expect(open).toHaveBeenCalledWith(
            'blob:https://portal.measurement.gov.au/pdf-id',
            '_blank',
            'noopener,noreferrer',
        );
    });
});
