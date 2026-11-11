import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { VITE_ENV_FIXTURES } from './runtime-env-fixtures';

type UnknownFunction = () => void;

const createVoidMock = () => vi.fn<UnknownFunction>();

Object.assign(import.meta.env, VITE_ENV_FIXTURES.vitest);

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

Object.defineProperty(globalThis.HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: createVoidMock(),
});

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

if (typeof HTMLCanvasElement !== 'undefined') {
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
}
