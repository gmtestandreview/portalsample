import { useLayoutEffect, useRef, type ReactNode } from 'react';

interface FetchOverride {
  token: symbol;
  fetchImpl: typeof globalThis.fetch;
}

const activeFetchOverrides: FetchOverride[] = [];
let baselineFetch: typeof globalThis.fetch | undefined;
let baselineWindowFetch: typeof globalThis.window.fetch | undefined;

const applyActiveFetchOverride = () => {
  const activeOverride = activeFetchOverrides.at(-1);
  if (activeOverride) {
    globalThis.fetch = activeOverride.fetchImpl;
    globalThis.window.fetch = activeOverride.fetchImpl;
    return;
  }

  if (baselineFetch && baselineWindowFetch) {
    globalThis.fetch = baselineFetch;
    globalThis.window.fetch = baselineWindowFetch;
  }
};

const PatchedFetch = ({
  children,
  fetchImpl,
}: {
  children: ReactNode;
  fetchImpl: typeof globalThis.fetch;
}) => {
  const tokenRef = useRef<symbol | null>(null);
  const initialFetchRef = useRef(fetchImpl);

  useLayoutEffect(() => {
    if (activeFetchOverrides.length === 0) {
      baselineFetch = globalThis.fetch;
      baselineWindowFetch = Reflect.get(globalThis.window, 'fetch');
    }

    const token = Symbol('storybook-fetch-override');
    tokenRef.current = token;
    activeFetchOverrides.push({
      token,
      fetchImpl: initialFetchRef.current,
    });
    applyActiveFetchOverride();

    return () => {
      const overrideIndex = activeFetchOverrides.findIndex(
        (override) => override.token === token,
      );
      if (overrideIndex >= 0) {
        activeFetchOverrides.splice(overrideIndex, 1);
      }
      tokenRef.current = null;

      applyActiveFetchOverride();
      if (activeFetchOverrides.length === 0) {
        baselineFetch = undefined;
        baselineWindowFetch = undefined;
      }
    };
  }, []);

  useLayoutEffect(() => {
    const activeOverride = activeFetchOverrides.find(
      (override) => override.token === tokenRef.current,
    );
    if (activeOverride) {
      activeOverride.fetchImpl = fetchImpl;
      applyActiveFetchOverride();
    }
  }, [fetchImpl]);

  return children;
};

export const withOptionalFetch = (
  children: ReactNode,
  fetchImpl?: typeof globalThis.fetch,
) => {
  if (!fetchImpl) {
    return <>{children}</>;
  }

  return <PatchedFetch fetchImpl={fetchImpl}>{children}</PatchedFetch>;
};
