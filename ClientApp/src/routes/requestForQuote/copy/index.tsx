import { useMsal } from '@azure/msal-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { ApplicationClient, ApplicationType } from '../../../api/web-api-client';
import { tokenRequest } from '../../../authentication/authConfig';
import BlockUISpinner from '../../../components/BlockUISpinner';
import AppLogger from '../../../instrumentation/AppLogger';

const CopyRequestForQuote = () => {
    const { accounts, instance } = useMsal();
    const isSaving = useRef(false);
    const [applicationId, setApplicationId] = useState<string>();
    const { id } = useParams();

    useEffect(() => {
        const copyApplication = async () => {
            isSaving.current = true;
            try {
                const client = new ApplicationClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                client.setAuthToken(tokenResult.accessToken);
                const application = await client.copyApplication(id!, { applicationType: ApplicationType.QuoteRequest });
                setApplicationId(application.referenceId!);
            } catch (e) {
                isSaving.current = false;
                AppLogger.error('Failed to copy application', e as Error);
            }
        };
        if (accounts.length > 0 && !isSaving.current) {
            copyApplication();
        }
    }, [accounts, id, instance, isSaving]);

    return (
        applicationId
            ? (
                <Navigate to={`/request-for-quote/${applicationId}/organisation-and-contact`} />
            )
            : (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            )
    );
};

export default CopyRequestForQuote;
