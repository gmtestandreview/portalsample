/**
 * Detailed MSW request output is opt-in so routine Storybook and CI runs stay
 * concise without suppressing warnings, errors, or unhandled requests.
 */
export const isStorybookMswDebugEnabled = (search: string): boolean =>
  new URLSearchParams(search).get('msw-debug') === 'true';

/**
 * Same-origin paths Storybook and Vite serve themselves: the preview shell and
 * index, the MSW worker script, Vite dev-server modules and prebundled
 * dependencies, built static assets and the public fonts and images. Anything
 * else is application traffic and needs an explicit handler.
 */
export const STORYBOOK_LOCAL_BYPASS_PREFIXES = [
  '/@',
  '/node_modules/',
  '/ClientApp/',
  '/.storybook/',
  '/sb-',
  '/__',
  '/assets/',
  '/fonts/',
] as const;

export const STORYBOOK_LOCAL_BYPASS_PATHS = [
  '/iframe.html',
  '/index.json',
  '/mockServiceWorker.js',
  '/favicon.ico',
  '/NMI-tile.png',
] as const;

export interface StorybookMswStartOptions {
  quiet: boolean;
  onUnhandledFrame: UnhandledFrameHandle;
}

export interface StorybookMswWorker {
  start: (options: StorybookMswStartOptions) => Promise<unknown>;
}

/**
 * Keep MSW startup behind the addon loader's async boundary. Creating the
 * loader must not create a worker or issue a request, and a rejected startup
 * remains rejected so request-producing story code cannot run without MSW.
 */
export const createStorybookMswWorkerLoader = <
  TWorker extends StorybookMswWorker,
>(
  workerFactory: () => TWorker,
  optionsFactory: () => StorybookMswStartOptions,
): (() => Promise<TWorker>) => {
  let workerPromise: Promise<TWorker> | undefined;

  return async () => {
    workerPromise ??= (async () => {
      const worker = workerFactory();
      await worker.start(optionsFactory());
      return worker;
    })();

    return workerPromise;
  };
};

const isLocalAssetOrToolingRequest = (requestUrl: URL): boolean => {
  if (requestUrl.origin !== globalThis.location.origin) {
    return false;
  }
  if (requestUrl.pathname.startsWith('/api/')) {
    return false;
  }

  return (
    (STORYBOOK_LOCAL_BYPASS_PATHS as readonly string[]).includes(
      requestUrl.pathname,
    ) ||
    STORYBOOK_LOCAL_BYPASS_PREFIXES.some((prefix) =>
      requestUrl.pathname.startsWith(prefix),
    )
  );
};

/**
 * Fail closed: an unhandled HTTP request is a story-owner failure unless it is
 * an explicit local asset or tooling request. That includes every foreign
 * origin (B2C login, telemetry, analytics) and any same-origin application
 * path, so no story can silently reach a real service.
 */
export const onUnhandledStorybookRequest: UnhandledFrameCallback = ({
  frame,
  defaults,
}) => {
  if (frame.protocol !== 'http') {
    return;
  }

  const requestUrl = new URL((frame.data as { request: Request }).request.url);

  if (!isLocalAssetOrToolingRequest(requestUrl)) {
    defaults.error();
  }
};
import type { UnhandledFrameHandle } from 'msw';

type UnhandledFrameCallback = Extract<
  UnhandledFrameHandle,
  (...args: never[]) => unknown
>;
