import '@testing-library/jest-dom/vitest';
import { afterAll, vi } from 'vitest';

type UnknownFunction = (...args: unknown[]) => void;

const createVoidMock = () => vi.fn<UnknownFunction>();

// ---------------------------------------------------------------------------
// Runtime environment variables (same as vitest.setup.ts and preview.ts)
// ---------------------------------------------------------------------------
Object.assign(import.meta.env, {
  VITE_B2C_CLIENTID: 'storybook-client-id',
  VITE_B2C_AUTHORITY: 'https://login.microsoftonline.com/common',
  VITE_B2C_KNOWN_AUTHORITIES: 'login.microsoftonline.com',
  VITE_B2C_POST_LOGOUT_REDIRECT_URL: 'http://localhost:6006',
  VITE_B2C_READ_SCOPE: 'openid',
  VITE_B2C_USER_IMPERSONATION_SCOPE: 'openid',
  VITE_B2C_REDIRECT_URL: 'http://localhost:6006',
  VITE_EXTERNAL_REDIRECT_URL: 'http://localhost:6006',
  VITE_APPINSIGHTS_INSTRUMENTATIONKEY: 'storybook-test-instrumentation-key',
  VITE_APPINSIGHTS_CONN_STRING: 'dummy-key',
  VITE_GA_TRACKINGID: 'storybook-test-ga-id',
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

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: createVoidMock(),
});

vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined);

const originalGetComputedStyle = globalThis.getComputedStyle.bind(globalThis);
globalThis.getComputedStyle = (element: Element) =>
  originalGetComputedStyle(element);

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

const expectedErrorBoundaryStoryMessages = [
  'Simulated render error from a broken child component.',
  'Inner component error',
  'This component threw a render error to demonstrate the ErrorBoundary.',
  'The above error occurred in the <BrokenApp> component',
  'The above error occurred in the <BrokenChild> component',
  'The above error occurred in the <ThrowingComponent> component',
];
const originalConsoleError = console.error;
// Anchor to the start of the message: each expected string is the leading text
// of its emitted error (a thrown Error.message, or React's "The above error
// occurred in…" prefix). Matching with `startsWith` instead of `includes` keeps
// every intended suppression while refusing to swallow a genuine application
// error that merely contains one of these substrings mid-message.
const isExpectedErrorBoundaryStoryError = (message: string) => {
  // The browser test runner re-reports a render error as "Uncaught Error: <message>".
  const unwrapped = message.replace(/^Uncaught (?:Error: )?/, '');
  return expectedErrorBoundaryStoryMessages.some((expected) =>
    unwrapped.startsWith(expected),
  );
};

const consoleErrorSpy = vi
  .spyOn(console, 'error')
  .mockImplementation((...args) => {
    const message = args
      .map((arg) => (arg instanceof Error ? arg.message : String(arg)))
      .join('\n');

    if (isExpectedErrorBoundaryStoryError(message)) {
      return;
    }

    originalConsoleError(...args);
  });

const handleExpectedErrorBoundaryStoryError = (event: ErrorEvent) => {
  if (
    isExpectedErrorBoundaryStoryError(event.error?.message ?? event.message)
  ) {
    event.preventDefault();
  }
};

globalThis.addEventListener('error', handleExpectedErrorBoundaryStoryError);

// Restore the global interception installed above so the spy and listener do not
// leak past this setup's test file.
afterAll(() => {
  consoleErrorSpy.mockRestore();
  globalThis.removeEventListener(
    'error',
    handleExpectedErrorBoundaryStoryError,
  );
});
