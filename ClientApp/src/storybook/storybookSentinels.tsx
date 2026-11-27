import { useContext, useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  AccountDispatchCtx,
  AccountStateCtx,
} from '../authentication/accountContext';

export const ProviderLifecycleSentinel = ({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) => {
  useLayoutEffect(() => {
    const body = globalThis.document.body;
    const postLifecycleEvent = (phase: 'mounted' | 'cleaned') => {
      const event = {
        type: 'storybook-portal-provider' as const,
        phase,
        sentinel: name,
      };
      if (globalThis.window.parent !== globalThis.window) {
        const parentWindow = globalThis.window
          .parent as typeof globalThis.window & {
          __storybookPortalProviderEvents?: (typeof event)[];
        };
        parentWindow.__storybookPortalProviderEvents?.push(event);
      }
    };

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      if (body.dataset['storybookProviderSentinel'] === name) {
        delete body.dataset['storybookProviderSentinel'];
      }
      postLifecycleEvent('cleaned');
    };

    body.dataset['storybookProviderSentinel'] = name;
    postLifecycleEvent('mounted');
    globalThis.addEventListener('pagehide', cleanup);

    return () => {
      globalThis.removeEventListener('pagehide', cleanup);
      cleanup();
    };
  }, [name]);

  return children;
};

export const AccountContextLifecycleSentinel = ({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) => {
  const accountState = useContext(AccountStateCtx);
  const accountDispatch = useContext(AccountDispatchCtx);
  const targetOrganisationName =
    accountState?.details?.targetOrganisation?.targetOrganisationName ?? null;
  const targetOrganisationNameRef = useRef(targetOrganisationName);

  useLayoutEffect(() => {
    targetOrganisationNameRef.current = targetOrganisationName;
  }, [targetOrganisationName]);

  useLayoutEffect(() => {
    accountDispatch?.setTargetOrganisation(name, `${name}:active`);
  }, [accountDispatch, name]);

  useLayoutEffect(() => {
    if (targetOrganisationName !== `${name}:active`) {
      return;
    }

    globalThis.document.body.dataset['storybookAccountTargetOrganisation'] =
      targetOrganisationName;
    if (globalThis.window.parent !== globalThis.window) {
      const parentWindow = globalThis.window
        .parent as typeof globalThis.window & {
        __storybookAccountLifecycleEvents?: {
          type: 'storybook-account-context';
          phase: 'active' | 'cleaned';
          sentinel: string;
          targetOrganisationName: string | null;
        }[];
      };
      parentWindow.__storybookAccountLifecycleEvents?.push({
        type: 'storybook-account-context',
        phase: 'active',
        sentinel: name,
        targetOrganisationName,
      });
    }
  }, [name, targetOrganisationName]);

  useLayoutEffect(() => {
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      delete globalThis.document.body.dataset[
        'storybookAccountTargetOrganisation'
      ];
      if (globalThis.window.parent !== globalThis.window) {
        const parentWindow = globalThis.window
          .parent as typeof globalThis.window & {
          __storybookAccountLifecycleEvents?: {
            type: 'storybook-account-context';
            phase: 'active' | 'cleaned';
            sentinel: string;
            targetOrganisationName: string | null;
          }[];
        };
        parentWindow.__storybookAccountLifecycleEvents?.push({
          type: 'storybook-account-context',
          phase: 'cleaned',
          sentinel: name,
          targetOrganisationName: targetOrganisationNameRef.current,
        });
      }
    };

    globalThis.addEventListener('pagehide', cleanup);
    return () => {
      globalThis.removeEventListener('pagehide', cleanup);
      cleanup();
    };
  }, [name]);

  return children;
};

export const SessionStorageLifecycleSentinel = ({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) => {
  useLayoutEffect(() => {
    const storage = globalThis.sessionStorage;
    const previousValue = storage.getItem(name);
    const activeValue = `${name}:active`;
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      if (previousValue === null) {
        storage.removeItem(name);
      } else {
        storage.setItem(name, previousValue);
      }
    };

    storage.setItem(name, `${name}:mounted`);
    storage.setItem(name, activeValue);
    globalThis.addEventListener('pagehide', cleanup);

    return () => {
      globalThis.removeEventListener('pagehide', cleanup);
      cleanup();
    };
  }, [name]);

  return children;
};
