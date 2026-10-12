/**
 * Detailed MSW request output is opt-in so routine Storybook and CI runs stay
 * concise without suppressing warnings, errors, or unhandled requests.
 */
export const isStorybookMswDebugEnabled = (search: string): boolean =>
  new URLSearchParams(search).get('msw-debug') === 'true';

/**
 * A missing same-origin API fixture is a story-owner failure. Static assets and
 * intentionally external requests keep the browser's normal bypass behavior.
 */
export const onUnhandledStorybookRequest: UnhandledFrameCallback = ({
  frame,
  defaults,
}) => {
  if (frame.protocol !== 'http') {
    return;
  }

  const requestUrl = new URL((frame.data as { request: Request }).request.url);

  if (
    requestUrl.origin === globalThis.location.origin &&
    requestUrl.pathname.startsWith('/api/')
  ) {
    defaults.error();
  }
};
import type { UnhandledFrameHandle } from 'msw';

type UnhandledFrameCallback = Extract<
  UnhandledFrameHandle,
  (...args: never[]) => unknown
>;
