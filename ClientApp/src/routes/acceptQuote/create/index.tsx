import { useMsal } from '@azure/msal-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { ApplicationClient, ApplicationType, QuoteClient } from '../../../api/web-api-client';
import { tokenRequest } from '../../../authentication/authConfig';
import BlockUISpinner from '../../../components/BlockUISpinner';
import AppLogger from '../../../instrumentation/AppLogger';

const CreateAcceptQuote = () => {
    const { id } = useParams<{ id?: string }>();
    const { accounts, instance } = useMsal();
    const isSaving = useRef(false);
    const [applicationId, setApplicationId] = useState<string>();

    useEffect(() => {
        const createApplication = async () => {
            try {
                AppLogger.verbose('CreateAcceptQuote.createApplication', { Id: id });
                const client = new ApplicationClient();
                const quoteClient = new QuoteClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                client.setAuthToken(tokenResult.accessToken);
                quoteClient.setAuthToken(tokenResult.accessToken);
                const quoteData = await quoteClient.getQuoteRequestDetailsByRefId(ApplicationType.QuoteRequest, id);

                const application = await client.createApplication({ applicationType: ApplicationType.QuoteAccept, referenceId: quoteData.crmQuoteRequestId });
                setApplicationId(application.referenceId!);
            } catch (e) {
                AppLogger.error('Failed to create an application', e as Error, { Id: id });
            }
        };
        if (!isSaving.current) {
            createApplication();
        }
        return () => { isSaving.current = true; };
    }, [accounts, id, instance, isSaving]);

    return (
        applicationId
            ? (
                <Navigate to={`/accept-quote/${applicationId}/report-recipient`} />
            )
            : (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            )
    );
};

export default CreateAcceptQuote;
