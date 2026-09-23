import { BrowserUtils, InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useEffect, useRef } from 'react';
import BlockUiSpinner from '../../components/BlockUISpinner/index.tsx';
import { clearTargetOrganisation } from '../../storage/targetOrganisation.ts';

const Signout = () => {
  const isUnmountedRef = useRef(false);
  const { instance, inProgress } = useMsal();
  useEffect(() => {
    async function logoutRedirect() {
      await instance.handleRedirectPromise();
      if (
        inProgress === InteractionStatus.None ||
        inProgress === InteractionStatus.Startup
      ) {
        await instance.logoutRedirect({
          account: instance.getActiveAccount(),
          onRedirectNavigate: () => !BrowserUtils.isInIframe(),
        });
      }
    }
    if (!isUnmountedRef.current) {
      logoutRedirect();
      clearTargetOrganisation();
    }
    return () => {
      isUnmountedRef.current = true;
    };
  }, [instance, inProgress]);

  return (
    <BlockUiSpinner>
      <p>Logging out...</p>
    </BlockUiSpinner>
  );
};

export default Signout;
