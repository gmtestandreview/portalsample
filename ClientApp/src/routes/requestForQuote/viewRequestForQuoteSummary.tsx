import { useEffect, useRef, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useParams } from 'react-router';
import useBodyClass from '../../components/Utilities/useBodyClass';
import type { SummaryProps } from './types';
import WizardForm from '../../components/forms/WizardForm';
import WizardStep from '../../components/forms/WizardForm/WizardStep';
import viewRequestForQuoteSummaryProps from './viewRequestForQuoteSummaryProps';
import RequestForQuoteSummary from './requestForQuoteSummary';
import type { WizardFormProps } from '../../components/forms/WizardForm/types';
import { useAccountState } from '../../authentication/hooks';
import { RequestForQuoteClient } from '../../api/web-api-client';
import type { FormStepStatusDto } from '../../api/web-api-client';
import type { AccountDetails } from '../../authentication/accountContext';
import { tokenRequest } from '../../authentication/authConfig';
import BlockUISpinner from '../../components/BlockUISpinner';
import AppLogger from '../../instrumentation/AppLogger';

const bannerTitle = 'Testing and calibration service - Request for quote';

const ViewRequestForQuoteSummary = ({ isSubmitted: _isSubmitted }: SummaryProps) => {
    const { accounts, instance } = useMsal();
    const { id } = useParams();
    const account = useAccountState();

    useBodyClass('summary');

    const requestForQuoteWizardProps: WizardFormProps = {
        locationOnCompletion: '/dashboard',
        previousButtonTitle: 'Back to dashboard',
        canSaveDraft: false,
        showSaveAndNextButton: false,
        showGoToDashboardButton: true,
        locationAfterExit: '/dashboard',
    };

    const isLoading = useRef(false);
    const [statuses, setStatuses] = useState<FormStepStatusDto[]>();

    useEffect(() => {
        const loadApplicationSteps = async () => {
            try {
                if (accounts.length > 0) {
                    const client = new RequestForQuoteClient();
                    const tokenResult = await instance.acquireTokenSilent({
                        ...tokenRequest,
                        account: accounts[0],
                    });
                    client.setAuthToken(tokenResult.accessToken);
                    const result = await client.getStepStatuses(id!);
                    setStatuses(result);
                }
            } catch (e) {
                AppLogger.error('Failed to retrieve step statuses', e as Error, { Id: id });
            }
        };
        if (!isLoading.current) {
            loadApplicationSteps();
        }
        return () => { isLoading.current = true; };
    }, [accounts, id, instance, isLoading]);

    const accountDetails : AccountDetails = account!.details!;
    const hasStatuses = statuses !== undefined;
    return (
        hasStatuses
            ? (
                <WizardForm {...requestForQuoteWizardProps}>
                    <WizardStep {...viewRequestForQuoteSummaryProps(id!, accounts, instance, accountDetails, statuses, bannerTitle)}>
                        <RequestForQuoteSummary name='' isSubmitted />
                    </WizardStep>
                </WizardForm>
            )
            : (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            ));
};

export default ViewRequestForQuoteSummary;
