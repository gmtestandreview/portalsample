import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Runtime environment variables (same as vitest.setup.ts and preview.ts)
// ---------------------------------------------------------------------------
Object.assign(globalThis, {
  REACT_APP_B2C_CLIENTID: 'storybook-client-id',
  REACT_APP_B2C_AUTHORITY: 'https://login.microsoftonline.com/common',
  REACT_APP_B2C_KNOWN_AUTHORITIES: 'login.microsoftonline.com',
  REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: 'http://localhost:6006',
  REACT_APP_B2C_READ_SCOPE: 'openid',
  REACT_APP_B2C_USER_IMPERSONATION_SCOPE: 'openid',
  REACT_APP_B2C_REDIRECT_URL: 'http://localhost:6006',
  EXTERNAL_REDIRECT_URL: 'http://localhost:6006',
  REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY:
    'storybook-test-instrumentation-key',
  REACT_APP_APPINSIGHTS_CONN_STRING: 'dummy-key',
  REACT_APP_GA_TRACKINGID: 'storybook-test-ga-id',
  REACT_APP_ENVIRONMENT: 'development',
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

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

globalThis.scrollTo = vi.fn();

const originalGetComputedStyle = globalThis.getComputedStyle.bind(globalThis);
globalThis.getComputedStyle = (element: Element) =>
  originalGetComputedStyle(element);

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
const isExpectedErrorBoundaryStoryError = (message: string) =>
  expectedErrorBoundaryStoryMessages.some((expected) =>
    message.startsWith(expected)
  );

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

// Storybook's browser preview owns MSW through mswLoader and the service worker.
// This setup file must remain browser-safe and must not import `msw/node`.
afterEach(() => cleanup());

// Restore the global interception installed above so the spy and listener do not
// leak past this setup's test file.
afterAll(() => {
  consoleErrorSpy.mockRestore();
  globalThis.removeEventListener(
    'error',
    handleExpectedErrorBoundaryStoryError
  );
});
