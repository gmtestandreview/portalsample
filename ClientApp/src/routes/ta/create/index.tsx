import { useMsal } from '@azure/msal-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { ApplicationClient, ApplicationType } from '../../../api/web-api-client';
import { tokenRequest } from '../../../authentication/authConfig';
import BlockUISpinner from '../../../components/BlockUISpinner';
import AppLogger from '../../../instrumentation/AppLogger';

const CreateRequestForTypeApproval = () => {
    const { accounts, instance } = useMsal();
    const isSaving = useRef(false);
    const [applicationId, setApplicationId] = useState<string>();

    useEffect(() => {
        const createApplication = async () => {
            try {
                // No applicationId check: the isSaving ref below already limits this to one run,
                // and on that run the id has not been set yet, so the guard could not fail.
                const client = new ApplicationClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                client.setAuthToken(tokenResult.accessToken);
                const application = await client.createApplication({ applicationType: ApplicationType.PatternApproval });
                setApplicationId(application.referenceId!);
            } catch (e) {
                AppLogger.error('Failed to create application', e as Error);
            }
        };
        if (!isSaving.current) {
            createApplication();
        }
        return () => { isSaving.current = true; };
    }, [accounts, applicationId, instance, isSaving]);

    return (
        applicationId
            ? (
                <Navigate to={`/ta/${applicationId}/organisation-details`} />
            )
            : (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            )
    );
};

export default CreateRequestForTypeApproval;
