import { useMsal } from '@azure/msal-react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import WizardForm from '../../components/forms/WizardForm';
import type { WizardFormProps } from '../../components/forms/WizardForm/types';
import WizardStep from '../../components/forms/WizardForm/WizardStep';
import useBodyClass from '../../components/Utilities/useBodyClass';
import { useAccountState } from '../../authentication/hooks';
import organisationAndContactProps from './organisationAndContactProps';
import InstrumentAndRequest from './instrumentAndRequest';
import instrumentAndRequestProps from './instrumentAndRequestProps';
import { RequestForQuoteClient } from '../../api/web-api-client';
import type { FormStepStatusDto } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import BlockUISpinner from '../../components/BlockUISpinner';
import RequestForQuoteSummary from './requestForQuoteSummary';
import requestForQuoteSummaryProps from './requestForQuoteSummaryProps';
import OrganisationAndContact from './organisationAndContact';
import AppLogger from '../../instrumentation/AppLogger';
import { getValidApplicationId } from '../common/routeParams';

const bannerTitle = 'Testing and calibration service - Request for quote';

const RequestForQuote = () => {
    const { accounts, instance } = useMsal();
    const { id } = useParams();
    const applicationId = getValidApplicationId(id);
    const account = useAccountState();
    const accountDetails = account?.details;
    const hasAccountDetails = Boolean(accountDetails);
    const navigate = useNavigate();

    useBodyClass('wizard');

    const isLoading = useRef(false);
    const [statuses, setStatuses] = useState<FormStepStatusDto[]>();

    useEffect(() => {
        let isMounted = true;

        const loadApplicationSteps = async () => {
            if (!applicationId) {
                return;
            }
            if (hasAccountDetails && !statuses && accounts.length > 0 && !isLoading.current) {
                isLoading.current = true;
                try {
                    const client = new RequestForQuoteClient();
                    const tokenResult = await instance.acquireTokenSilent({
                        ...tokenRequest,
                        account: accounts[0],
                    });
                    client.setAuthToken(tokenResult.accessToken);
                    const result = await client.getStepStatuses(applicationId);
                    if (!isMounted) {
                        return;
                    }
                    setStatuses(result);
                } catch (error) {
                    if (!isMounted) {
                        return;
                    }
                    AppLogger.error('Failed to load application steps', error as Error, { Id: applicationId });
                    navigate('/not-found');
                } finally {
                    isLoading.current = false;
                }
            }
        };
        loadApplicationSteps();

        return () => {
            isMounted = false;
        };
    }, [accounts, applicationId, hasAccountDetails, instance, isLoading, navigate, statuses]);

    if (!applicationId) {
        return <Navigate to='/not-found' replace />;
    }

    if (!accountDetails) {
        return (
            <BlockUISpinner>
                <p>Loading...</p>
            </BlockUISpinner>
        );
    }

    const requestForQuoteWizardProps: WizardFormProps = {
        locationOnCompletion: `/request-for-quote-success/${applicationId}`,
        lastStepNextButtonTitle: 'Submit',
        nextButtonTitle: 'Save and next',
        previousButtonTitle: 'Back',
        canSaveDraft: true,
        confirmationOnSubmission: {
            modalTitle: 'Are you sure you want to submit this request?',
            modalBodyText: `Once you have submitted this request,
        you will not be able to make any further changes in the Portal.`,
            noButtonTitle: 'No, go back',
            yesButtonTitle: 'Yes, submit',
        },
    };

    return (
        statuses
            ? (
                <WizardForm {...requestForQuoteWizardProps}>
                    <WizardStep {...organisationAndContactProps(applicationId, accounts, instance, accountDetails, statuses, bannerTitle)}>
                        <OrganisationAndContact name='' />
                    </WizardStep>
                    <WizardStep {...instrumentAndRequestProps(applicationId, accounts, instance, accountDetails, statuses, bannerTitle)}>
                        <InstrumentAndRequest name='' />
                    </WizardStep>
                    <WizardStep {...requestForQuoteSummaryProps(applicationId, accounts, instance, accountDetails, statuses, bannerTitle)}>
                        <RequestForQuoteSummary name='' />
                    </WizardStep>
                </WizardForm>
            )
            : (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            ));
};

export default RequestForQuote;
