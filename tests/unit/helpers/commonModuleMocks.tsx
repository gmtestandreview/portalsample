import type { ReactNode } from 'react';
import { vi } from 'vitest';

/**
 * Shared bodies for `vi.mock` factories that many route suites repeat.
 *
 * `vi.mock` is hoisted above imports, so a suite must load these lazily:
 *
 *   vi.mock(import('<module>') as unknown as string, async () =>
 *     (await import('../helpers/commonModuleMocks')).blockUiSpinnerModule(),
 *   );
 */

/** Replaces `BlockUISpinner` with a `block-spinner` test id wrapper. */
export const blockUiSpinnerModule = () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid='block-spinner'>{children}</div>
  ),
});

/** Replaces a default-exported side-effect hook, such as `useBodyClass`. */
export const noopHookModule = () => ({
  default: vi.fn<() => void>(),
});
