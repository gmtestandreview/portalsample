import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

type UnknownFunction = (...args: unknown[]) => void;

const createVoidMock = () => vi.fn<UnknownFunction>();

Object.assign(import.meta.env, {
  VITE_B2C_CLIENTID: 'test-client-id',
  VITE_B2C_AUTHORITY: 'https://login.microsoftonline.com/common',
  VITE_B2C_KNOWN_AUTHORITIES: 'login.microsoftonline.com',
  VITE_B2C_POST_LOGOUT_REDIRECT_URL: 'http://localhost:3000',
  VITE_B2C_READ_SCOPE: 'openid',
  VITE_B2C_USER_IMPERSONATION_SCOPE: 'openid',
  VITE_B2C_REDIRECT_URL: 'http://localhost:3000',
  VITE_APPINSIGHTS_INSTRUMENTATIONKEY: 'test-instrumentation-key',
  VITE_APPINSIGHTS_CONN_STRING: 'InstrumentationKey=test-instrumentation-key',
  VITE_GA_TRACKINGID: 'test-ga-id',
  VITE_EXTERNAL_REDIRECT_URL: 'http://localhost:3000',
  VITE_ENVIRONMENT: 'development',
});

if (!globalThis.matchMedia) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn<(query: string) => MediaQueryList>().mockImplementation(
      (query) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: createVoidMock(),
          removeListener: createVoidMock(),
          addEventListener: createVoidMock(),
          removeEventListener: createVoidMock(),
          dispatchEvent: createVoidMock(),
        }) as unknown as MediaQueryList,
    ),
  });
}

if (!HTMLElement.prototype.scrollIntoView) {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    writable: true,
    value: createVoidMock(),
  });
}

// Node 24 and jsdom 30 both expose URL.createObjectURL, but Vitest's Node
// compatibility wrapper cannot consume a jsdom Blob through that implementation.
// Keep object URLs deterministic and browser-independent in unit tests.
Object.defineProperty(globalThis.URL, 'createObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn<() => string>(() => 'blob:unit-test'),
});

Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
  configurable: true,
  writable: true,
  value: createVoidMock(),
});

Object.defineProperty(globalThis, 'scrollTo', {
  writable: true,
  value: createVoidMock(),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value: vi.fn<() => CanvasRenderingContext2D>(
    () =>
      ({
        arc: createVoidMock(),
        beginPath: createVoidMock(),
        canvas: document.createElement('canvas'),
        clearRect: createVoidMock(),
        clip: createVoidMock(),
        closePath: createVoidMock(),
        createImageData: vi.fn<() => ImageData>(
          () => [] as unknown as ImageData,
        ),
        drawImage: createVoidMock(),
        fill: createVoidMock(),
        fillRect: createVoidMock(),
        fillText: createVoidMock(),
        getImageData: vi.fn<() => ImageData>(
          () => ({ data: [] }) as unknown as ImageData,
        ),
        lineTo: createVoidMock(),
        measureText: vi.fn<() => TextMetrics>(
          () => ({ width: 0 }) as TextMetrics,
        ),
        moveTo: createVoidMock(),
        putImageData: createVoidMock(),
        rect: createVoidMock(),
        restore: createVoidMock(),
        rotate: createVoidMock(),
        save: createVoidMock(),
        scale: createVoidMock(),
        setTransform: createVoidMock(),
        stroke: createVoidMock(),
        transform: createVoidMock(),
        translate: createVoidMock(),
      }) as unknown as CanvasRenderingContext2D,
  ),
});
