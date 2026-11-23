import { useMsal } from '@azure/msal-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import {
  ApplicationClient,
  ApplicationType,
} from '../../../api/web-api-client';
import { silentRequestFor } from '../../../authentication/silentRequest';
import BlockUISpinner from '../../../components/BlockUISpinner';
import AppLogger from '../../../instrumentation/AppLogger';

const CreateRequestForQuote = () => {
  const { accounts, instance } = useMsal();
  const isSavingRef = useRef(false);
  const [applicationId, setApplicationId] = useState<string>();

  useEffect(() => {
    const createApplication = async () => {
      isSavingRef.current = true;
      try {
        const client = new ApplicationClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0]),
        );
        client.setAuthToken(tokenResult.accessToken);
        const application = await client.createApplication({
          applicationType: ApplicationType.QuoteRequest,
        });
        setApplicationId(application.referenceId);
      } catch (e) {
        isSavingRef.current = false;
        AppLogger.error('Failed to create application', e as Error);
      }
    };
    if (accounts.length > 0 && !isSavingRef.current) {
      void createApplication();
    }
  }, [accounts, instance, isSavingRef]);

  return applicationId ? (
    <Navigate
      to={`/request-for-quote/${applicationId}/organisation-and-contact`}
    />
  ) : (
    <BlockUISpinner>
      <p>Loading...</p>
    </BlockUISpinner>
  );
};

export default CreateRequestForQuote;
