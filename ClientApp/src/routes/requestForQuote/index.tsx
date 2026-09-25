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

    /**
     * True only once the wizard has actually unmounted.
     *
     * Both halves of this matter, and each was got wrong once. It is a ref with its own
     * empty-dependency effect rather than a `let` inside the loader effect, because that effect
     * depends on `accounts`, `instance` and `statuses` - its cleanup runs on any of those changing,
     * not just on unmount. And the flag is reset when the effect runs, not merely initialised,
     * because StrictMode remounts in development.
     *
     * Either mistake produces the same failure: an in-flight load is marked abandoned while
     * `isLoading.current` is still true, which blocks the re-run from starting a replacement. The
     * response then arrives, sees the flag, and drops the result - leaving `statuses` undefined with
     * nothing left to retrigger the effect, and the wizard stuck on its spinner for good.
     */
    const isUnmounted = useRef(false);

    useEffect(() => {
        // Reset on every mount, not just initialised once. StrictMode mounts, unmounts and remounts
        // in development, so without this the cleanup latches the ref true during that simulated
        // unmount and nothing ever clears it - the first real response is then discarded and the
        // wizard sits on its spinner forever. Only the development build shows it, which is why the
        // unit suite (no StrictMode wrapper) passed while the browser-driven e2e did not.
        isUnmounted.current = false;

        return () => {
            isUnmounted.current = true;
        };
    }, []);

    useEffect(() => {
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
                    if (isUnmounted.current) {
                        return;
                    }
                    setStatuses(result);
                } catch (error) {
                    if (isUnmounted.current) {
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
