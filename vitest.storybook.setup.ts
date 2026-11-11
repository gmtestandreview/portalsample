import '@testing-library/jest-dom/vitest';
import { afterAll, vi } from 'vitest';
import { VITE_ENV_FIXTURES } from './runtime-env-fixtures';

type UnknownFunction = (..._args: unknown[]) => void;

const createVoidMock = () => vi.fn<UnknownFunction>();

Object.assign(import.meta.env, VITE_ENV_FIXTURES.storybook);

const mockMatchMediaImplementation = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: createVoidMock(),
    removeListener: createVoidMock(),
    addEventListener: createVoidMock(),
    removeEventListener: createVoidMock(),
    dispatchEvent: createVoidMock(),
  }) as unknown as MediaQueryList;

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi
    .fn<(query: string) => MediaQueryList>()
    .mockImplementation(mockMatchMediaImplementation),
});

Object.defineProperty(globalThis.HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: createVoidMock(),
});

vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined);

const originalGetComputedStyle = globalThis.getComputedStyle.bind(globalThis);
globalThis.getComputedStyle = (element: Element) =>
  originalGetComputedStyle(element);

Object.defineProperty(globalThis.HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value: vi.fn<() => CanvasRenderingContext2D>(
    () =>
      ({
        arc: createVoidMock(),
        beginPath: createVoidMock(),
        canvas: globalThis.document.createElement('canvas'),
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
const originalConsoleError = globalThis.console.error;
// Anchor to the start of the message: each expected string is the leading text
// of its emitted error (a thrown Error.message, or React's "The above error
// occurred in…" prefix). Matching with `startsWith` instead of `includes` keeps
// every intended suppression while refusing to swallow a genuine application
// error that merely contains one of these substrings mid-message.
const isExpectedErrorBoundaryStoryError = (message: string) => {
  // The browser test runner re-reports a render error as "Uncaught Error: <message>".
  const unwrapped = message.replace(/^Uncaught (?:Error: )?/u, '');
  return expectedErrorBoundaryStoryMessages.some((expected) =>
    unwrapped.startsWith(expected),
  );
};

const consoleErrorSpy = vi
  .spyOn(globalThis.console, 'error')
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
  const eventError: unknown = event.error;
  const message =
    eventError instanceof Error ? eventError.message : event.message;

  if (isExpectedErrorBoundaryStoryError(message)) {
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
