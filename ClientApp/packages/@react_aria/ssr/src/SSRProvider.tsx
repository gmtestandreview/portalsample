/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// We must avoid a circular dependency with @react-aria/utils, and this useLayoutEffect is
// guarded by a check that it only runs on the client side.
import React, {
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { JSX, ReactNode } from 'react';

// To support SSR, the auto incrementing id counter is stored in a context. This allows
// it to be reset on every request to ensure the client and server are consistent.
// There is also a prefix string that is used to support async loading components
// Each async boundary must be wrapped in an SSR provider, which appends to the prefix
// and resets the current id counter. This ensures that async loaded components have
// consistent ids regardless of the loading order.
interface SSRContextValue {
  prefix: string;
  current: number;
}

// Default context value to use in case there is no SSRProvider. This is fine for
// client-only apps. In order to support multiple copies of React Aria potentially
// being on the page at once, the prefix is allocated from a per-runtime counter.
// SSRProvider will reset this to zero for consistency between server and client,
// so in the SSR case multiple copies of React Aria is not supported.
declare global {
  var __reactAriaSSRContextPrefix: number | undefined;
}

const contextPrefix = globalThis.__reactAriaSSRContextPrefix ?? 0;
globalThis.__reactAriaSSRContextPrefix = contextPrefix + 1;

const defaultContext: SSRContextValue = {
  prefix: String(contextPrefix),
  current: 0,
};

const SSRContext = React.createContext<SSRContextValue>(defaultContext);
const IsSSRContext = React.createContext(false);

export interface SSRProviderProps {
  /** Your application here. */
  children: ReactNode;
}

// This is only used in React < 18.
function LegacySSRProvider(props: Readonly<SSRProviderProps>): JSX.Element {
  const cur = useContext(SSRContext);
  const counter = useCounter(cur === defaultContext);
  const [isSSR, setIsSSR] = useState(true);
  const value: SSRContextValue = useMemo(
    () => ({
      // If this is the first SSRProvider, start with an empty string prefix, otherwise
      // append and increment the counter.
      prefix: cur === defaultContext ? '' : `${cur.prefix}-${counter ?? 0}`,
      current: 0,
    }),
    [cur, counter],
  );

  // If on the client, and the component was initially server rendered,
  // then schedule a layout effect to update the component after hydration.
  useSSRLayoutEffect(() => {
    setIsSSR(false);
  }, []);

  return (
    <SSRContext.Provider value={value}>
      <IsSSRContext.Provider value={isSSR}>
        {props.children}
      </IsSSRContext.Provider>
    </SSRContext.Provider>
  );
}

let warnedAboutSSRProvider = false;

/**
 * When using SSR with React Aria in React 16 or 17, applications must be wrapped in an SSRProvider.
 * This ensures that auto generated ids are consistent between the client and server.
 */
export function SSRProvider(props: Readonly<SSRProviderProps>): JSX.Element {
  if (typeof React.useId === 'function') {
    if (
      process.env['NODE_ENV'] !== 'test' &&
      process.env['NODE_ENV'] !== 'production' &&
      !warnedAboutSSRProvider
    ) {
      console.warn(
        'In React 18, SSRProvider is not necessary and is a noop. You can remove it from your app.',
      );
      warnedAboutSSRProvider = true;
    }
    return <>{props.children}</>;
  }
  return <LegacySSRProvider {...props} />;
}

const canUseDOM = typeof document !== 'undefined';

interface ReactFiber {
  memoizedState: unknown;
}

interface ComponentIdState {
  id: number;
  state: unknown;
}

interface ReactInternals {
  ReactCurrentOwner?: {
    current: ReactFiber | null;
  };
}

type ReactWithInternals = typeof React & {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: ReactInternals;
};

const reactWithInternals = React as ReactWithInternals;
const componentIds = new WeakMap<ReactFiber, ComponentIdState>();

function useCounter(isDisabled = false): number | null {
  const ctx = useContext(SSRContext);
  const ref = useRef<number | null>(null);
  if (ref.current === null && !isDisabled) {
    // In strict mode, React renders components twice, and the ref will be reset to null on the second render.
    // This means our id counter will be incremented twice instead of once. This is a problem because on the
    // server, components are only rendered once and so ids generated on the server won't match the client.
    // In React 18, useId was introduced to solve this, but it is not available in older versions. So to solve this
    // we need to use some React internals to access the underlying Fiber instance, which is stable between renders.
    // This is exposed as ReactCurrentOwner in development, which is all we need since StrictMode only runs in development.
    // To ensure that we only increment the global counter once, we store the starting id for this component in
    // a weak map associated with the Fiber. On the second render, we reset the global counter to this value.
    // Since React runs the second render immediately after the first, this is safe.
    const currentOwner =
      reactWithInternals.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        ?.ReactCurrentOwner?.current;
    if (currentOwner) {
      const prevComponentValue = componentIds.get(currentOwner);
      if (prevComponentValue == null) {
        // On the first render, and first call to useId, store the id and state in our weak map.
        componentIds.set(currentOwner, {
          id: ctx.current,
          state: currentOwner.memoizedState,
        });
      } else if (currentOwner.memoizedState !== prevComponentValue.state) {
        // On the second render, the memoizedState gets reset by React.
        // Reset the counter, and remove from the weak map so we don't
        // do this for subsequent useId calls.
        ctx.current = prevComponentValue.id;
        componentIds.delete(currentOwner);
      }
    }

    ref.current = ++ctx.current;
  }

  return ref.current;
}

function useLegacySSRSafeId(defaultId?: string): string {
  const ctx = useContext(SSRContext);

  // If we are rendering in a non-DOM environment, and there's no SSRProvider,
  // provide a warning to hint to the developer to add one.
  if (
    ctx === defaultContext &&
    !canUseDOM &&
    process.env['NODE_ENV'] !== 'production'
  ) {
    console.warn(
      'When server rendering, you must wrap your application in an <SSRProvider> to ensure consistent ids are generated between the client and server.',
    );
  }

  const counter = useCounter(!!defaultId);
  const prefix =
    ctx === defaultContext && process.env['NODE_ENV'] === 'test'
      ? 'react-aria'
      : `react-aria${ctx.prefix}`;
  return defaultId ?? `${prefix}-${counter ?? 0}`;
}

function useModernSSRSafeId(defaultId?: string): string {
  const id = React.useId();
  const [didSSR] = useState(useIsSSR());
  const prefix =
    didSSR || process.env['NODE_ENV'] === 'test'
      ? 'react-aria'
      : `react-aria${defaultContext.prefix}`;
  return defaultId ?? `${prefix}-${id}`;
}

// Use React.useId in React 18 if available, otherwise fall back to our old implementation.
/** @private */
export const useSSRSafeId:
  | typeof useModernSSRSafeId
  | typeof useLegacySSRSafeId =
  typeof React.useId === 'function' ? useModernSSRSafeId : useLegacySSRSafeId;

function getSnapshot() {
  return false;
}

function getServerSnapshot() {
  return true;
}

function subscribe(_onStoreChange: () => void): () => void {
  return () => undefined;
}

/**
 * Returns whether the component is currently being server side rendered or
 * hydrated on the client. Can be used to delay browser-specific rendering
 * until after hydration.
 */
export function useIsSSR(): boolean {
  // In React 18, we can use useSyncExternalStore to detect if we're server rendering or hydrating.
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot,
    );
  }

  return useContext(IsSSRContext);
}

const useSSRLayoutEffect: typeof useLayoutEffect =
  typeof document !== 'undefined' ? useLayoutEffect : () => undefined;
