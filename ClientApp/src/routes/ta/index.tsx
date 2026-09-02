import { useMsal } from '@azure/msal-react';
import { useNavigate, useParams } from 'react-router';
import {
    useCallback, useEffect, useRef, useState,
} from 'react';
import WizardForm from '../../components/forms/WizardForm';
import type { WizardFormProps } from '../../components/forms/WizardForm/types';
import WizardStep from '../../components/forms/WizardForm/WizardStep';
import useBodyClass from '../../components/Utilities/useBodyClass';
import useAccountContext from '../../authentication/hooks';
import {
    type AttachmentDto, type FileParameter, type FormStepStatusDto, ProgressClient, RequestForPatternApprovalClient,
    type UploadProgress,
} from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import BlockUISpinner from '../../components/BlockUISpinner';
import type { AccountDetails } from '../../authentication/accountContext';
import AppLogger from '../../instrumentation/AppLogger';
import ApplicationAndInstrument from './applicationAndInstrument';
import applicationAndInstrumentProps from './applicationAndInstrumentProps';
import SummaryAndSubmit from './summaryAndSubmit';
import summaryAndSubmitProps from './summaryAndSubmitProps';
import SupportingDocuments from './supportingDocuments';
import supportingDocumentsProps from './supportingDocumentsProps';
import organisationAndContactProps from './organisationAndContactProps';
import OrganisationAndContact from './organisationAndContact';

const bannerTitle = 'Pattern/type approval - Application';

const ApplicationForTypeApproval = () => {
    const { accounts, instance } = useMsal();
    const { id } = useParams();
    const account = useAccountContext();
    const navigate = useNavigate();
    // Upload
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgress | undefined>(undefined);
    const abortRef = useRef<AbortController | null>(null);
    const uploadIdRef = useRef<string | null>(null);
    const [submitErrors, setSubmitErrors] = useState<string[]>([]);

    useBodyClass('wizard');

    const applicationForTypeApprovalProps: WizardFormProps = {
        locationOnCompletion: `/ta/type-approval-success/${id}`,
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

    const isLoading = useRef(false);
    const [statuses, setStatuses] = useState<FormStepStatusDto[]>();

    useEffect(() => {
        const loadApplicationSteps = async () => {
            if (!statuses && accounts.length > 0) {
                const client = new RequestForPatternApprovalClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                client.setAuthToken(tokenResult.accessToken);
                try {
                    const result = await client.getStepStatuses(id!);
                    setStatuses(result);
                } catch (error) {
                    AppLogger.error('Failed to load application steps', error as Error, { Id: id });
                    navigate('/not-found');
                }
            }
        };
        if (!isLoading.current) {
            loadApplicationSteps();
        }
        return () => { isLoading.current = true; };
    }, [accounts, id, instance, isLoading, navigate, statuses]);

    useEffect(() => () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
    }, []);

    const startLongPolling = useCallback(
        async (uploadId: string) => {
            const controller = new AbortController();
            abortRef.current = controller;
            let lastPercent = -1;
            const client = new ProgressClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            while (!controller.signal.aborted) {
                try {
                    client.setAuthToken(tokenResult.accessToken);
                     
                    const data = await client.getProgress(
                        uploadId,
                        lastPercent,
                        controller.signal,
                    );
                    setProgress(data);
                    lastPercent = data.percent!;

                    if (data.status === 'Completed' || data.status === 'CompletedWithErrors') {
                        setUploading(false);
                        client.deleteProgressStatistics(uploadId).catch((error) => {
                            AppLogger.error('Failed to delete progress statistics', error as Error, { uploadId });
                        });
                        break;
                    }
                } catch {
                    if (controller.signal.aborted) break;
                    // await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }
        },
        [accounts, instance],
    );

    const handleCancelFile = async (fileName: string) => {
        if (!uploadIdRef.current) return;
        try {
            const client = new ProgressClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            await client.cancelFile(uploadIdRef.current, fileName);
        } catch {
            // Cancellation is best-effort; progress polling will reflect the final state
        }
    };

    const onUploadAttachments = async (
        token: string,
        fileData: FileParameter[],
    ): Promise<AttachmentDto[]> => {
        let attachments = [] as AttachmentDto[];
        try {
            const clientProgress = new ProgressClient();
            clientProgress.setAuthToken(token);
            const uploadId = await clientProgress.getProgressUploadId();
            uploadIdRef.current = uploadId;
            if (uploadIdRef.current) {
                startLongPolling(uploadIdRef.current);
            }
            const clientPA = new RequestForPatternApprovalClient();
            clientPA.setAuthToken(token);
            const result = await clientPA.addDocuments(id, null, uploadId, fileData, null, null);
            const { documents } = result.form || {};
            uploadIdRef.current = result.uploadId!;

            attachments = documents?.map((x) => ({
                id: x.id,
                documentReference: x.id,
                attachmentType: x.attachmentType,
                attachmentMimeType: x.attachmentMimeType,
                attachmentSize: x.attachmentSize,
                attachmentName: x.attachmentName,
                attachmentUrl: x.attachmentUrl,
                attachmentCategory: x.attachmentCategory,
                parentTimeStamp: new Date().toDateString(),
            } as AttachmentDto)) ?? [];
        } catch (e) {
        // handle errors as needed
            const status = (e as any)?.status as number | undefined;

            if (status === 403) {
                setSubmitErrors(['Upload blocked for security reasons. Please rename the file and try again. If the issue continues, contact support.']);
            } else if (status && status >= 500) {
                setSubmitErrors(['A server error occurred. Please try again.']);
            } else {
                setSubmitErrors(['Failed to commit documents.']);
            }

            AppLogger.error('Failed to load application documents', e as Error, { Id: id, Status: status });
        }
        return attachments;
    };

    const accountDetails : AccountDetails = account!.details!;
    return (
        !statuses
            ? (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            )
            : (
                <WizardForm {...applicationForTypeApprovalProps}>
                    <WizardStep {...organisationAndContactProps(id!, accounts, instance, accountDetails, statuses, bannerTitle)}>
                        <OrganisationAndContact name='' />
                    </WizardStep>
                    <WizardStep {...applicationAndInstrumentProps(id!, accounts, instance, accountDetails, statuses, bannerTitle)}>
                        <ApplicationAndInstrument name='' />
                    </WizardStep>
                    <WizardStep {...supportingDocumentsProps(id!, accounts, instance, accountDetails, statuses, bannerTitle)}>
                        <SupportingDocuments
                            name='form.documents'
                            isSummary={false}
                            onUploadAttachment={onUploadAttachments}
                            attachment={{
                                onUploadFiles: () => Promise.resolve([]), // Not used
                            }}
                            progress={progress}
                            setProgress={setProgress}
                            uploading={uploading}
                            handleCancelFile={handleCancelFile}
                            externalErrors={submitErrors}
                            setExternalErrors={setSubmitErrors}
                        />
                    </WizardStep>
                    <WizardStep {...summaryAndSubmitProps(id!, accounts, instance, accountDetails, statuses, bannerTitle)}>
                        <SummaryAndSubmit name='' />
                    </WizardStep>
                </WizardForm>
            ));
};

export default ApplicationForTypeApproval;
