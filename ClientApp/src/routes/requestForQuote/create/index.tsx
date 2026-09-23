import { useMsal } from '@azure/msal-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import {
  ApplicationClient,
  ApplicationType,
} from '../../../api/web-api-client.ts';
import { tokenRequest } from '../../../authentication/authConfig.ts';
import BlockUiSpinner from '../../../components/BlockUISpinner/index.tsx';
import AppLogger from '../../../instrumentation/AppLogger.ts';

const CreateRequestForQuote = () => {
  const { accounts, instance } = useMsal();
  const isSaving = useRef(false);
  const [applicationId, setApplicationId] = useState<string>();

  useEffect(() => {
    const createApplication = async () => {
      isSaving.current = true;
      try {
        const client = new ApplicationClient();
        const tokenResult = await instance.acquireTokenSilent({
          ...tokenRequest,
          account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);
        const application = await client.createApplication({
          applicationType: ApplicationType.QuoteRequest,
        });
        setApplicationId(application.referenceId!);
      } catch (e) {
        isSaving.current = false;
        AppLogger.error('Failed to create application', e as Error);
      }
    };
    if (accounts.length > 0 && !isSaving.current) {
      createApplication();
    }
  }, [accounts, instance]);

  return applicationId ? (
    <Navigate
      to={`/request-for-quote/${applicationId}/organisation-and-contact`}
    />
  ) : (
    <BlockUiSpinner>
      <p>Loading...</p>
    </BlockUiSpinner>
  );
};

export default CreateRequestForQuote;
