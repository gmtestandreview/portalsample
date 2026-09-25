import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
    cleanup();
});

Object.assign(globalThis, {
    REACT_APP_B2C_CLIENTID: 'test-client-id',
    REACT_APP_B2C_AUTHORITY: 'https://login.microsoftonline.com/common',
    REACT_APP_B2C_KNOWN_AUTHORITIES: 'login.microsoftonline.com',
    REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: 'http://localhost:3000',
    REACT_APP_B2C_READ_SCOPE: 'openid',
    REACT_APP_B2C_USER_IMPERSONATION_SCOPE: 'openid',
    REACT_APP_B2C_REDIRECT_URL: 'http://localhost:3000',
    REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY: 'test-instrumentation-key',
    REACT_APP_APPINSIGHTS_CONN_STRING: 'InstrumentationKey=test-instrumentation-key',
    REACT_APP_GA_TRACKINGID: 'test-ga-id',
    EXTERNAL_REDIRECT_URL: 'http://localhost:3000',
});

if (!globalThis.matchMedia) {
    Object.defineProperty(globalThis, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
}

if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = vi.fn();
}

if (!globalThis.URL.createObjectURL) {
    Object.defineProperty(globalThis.URL, 'createObjectURL', {
        writable: true,
        value: vi.fn(() => 'blob:unit-test'),
    });
}

if (!globalThis.URL.revokeObjectURL) {
    Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
        writable: true,
        value: vi.fn(),
    });
}

Object.defineProperty(globalThis, 'scrollTo', {
    writable: true,
    value: vi.fn(),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    writable: true,
    value: vi.fn(() => ({
        arc: vi.fn(),
        beginPath: vi.fn(),
        canvas: document.createElement('canvas'),
        clearRect: vi.fn(),
        clip: vi.fn(),
        closePath: vi.fn(),
        createImageData: vi.fn(() => []),
        drawImage: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        getImageData: vi.fn(() => ({ data: [] })),
        lineTo: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        moveTo: vi.fn(),
        putImageData: vi.fn(),
        rect: vi.fn(),
        restore: vi.fn(),
        rotate: vi.fn(),
        save: vi.fn(),
        scale: vi.fn(),
        setTransform: vi.fn(),
        stroke: vi.fn(),
        transform: vi.fn(),
        translate: vi.fn(),
    })),
});
