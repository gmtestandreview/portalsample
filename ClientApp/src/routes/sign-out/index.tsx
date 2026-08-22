import { BrowserUtils, InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useEffect, useRef } from 'react';
import BlockUISpinner from '../../components/BlockUISpinner';
import { clearTargetOrganisation } from '../../storage/targetOrganisation';

const Signout = () => {
    const isUnmountedRef = useRef(false);
    const { instance, inProgress } = useMsal();
    useEffect(() => {
        async function logoutRedirect() {
            await instance.handleRedirectPromise();
            if (inProgress === InteractionStatus.None || inProgress === InteractionStatus.Startup) {
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
        return () => { isUnmountedRef.current = true; };
    }, [instance, inProgress]);

    return (
        <BlockUISpinner>
            <p>Logging out...</p>
        </BlockUISpinner>
    );
};

export default Signout;
