import { useMsal } from '@azure/msal-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router';
import { Button, Col, Row } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import {
  type UploadProgress,
  type AttachmentDto,
  type FileParameter,
  ProgressClient,
  RequestForPatternApprovalClient,
  type SupportingDocumentsStep,
} from '../../../api/web-api-client';

import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';

import useBodyClass from '../../../components/Utilities/useBodyClass';
import BlockUISpinner from '../../../components/BlockUISpinner';

import { silentRequestFor } from '../../../authentication/silentRequest';
import AppLogger from '../../../instrumentation/AppLogger';
import RhfSupportingDocuments from '../rhfSupportingDocuments';
import { createSaveAwareYupResolver } from '../../../components/forms/saveAwareYupResolver';
import { supportingDocsSubmitValidation } from '../validation';
import { pollUploadProgress } from '../pollUploadProgress';

interface AppDocumentsFormValues {
  form: {
    documents: AttachmentDto[];
    instrumentCategory?: string | undefined;
    instrumentType?: string | undefined;
  };
}

const ApplicationDocuments = () => {
  const { accounts, instance } = useMsal();
  const { id } = useParams();
  const [isDataLoading, setIsDataLoading] = useState(false);

  useHtmlTitle(`[New certificate] (${id}) manage | NMI Services portal`);
  useBodyClass('pa-application-manage');

  // SupportingDocuments upload state and handlers (from ta/index.tsx)
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | undefined>(
    undefined
  );
  const abortRef = useRef<AbortController | null>(null);
  const uploadIdRef = useRef<string | null>(null);

  // Saved documents, used as the form's values
  const [filesUploaded, setFilesUploaded] =
    useState<SupportingDocumentsStep | null>(null);
  const [filesToCommit, setFilesToCommit] = useState<boolean>(false);
  const [commitSuccess, setCommitSuccess] = useState<boolean>(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      setIsDataLoading(true);
      try {
        if (accounts.length > 0 && id) {
          const client = new RequestForPatternApprovalClient();
          const tokenResult = await instance.acquireTokenSilent(
            silentRequestFor(accounts[0])
          );
          client.setAuthToken(tokenResult.accessToken);
          const response = await client.getAppDocuments(id);
          setFilesUploaded(response);
          setFilesToCommit(
            response?.form?.documents?.some((doc) => !doc.documentLocked) ??
              false
          );
        }
      } catch (e) {
        AppLogger.error('Failed to load application documents', e as Error, {
          Id: id,
        });
      } finally {
        setIsDataLoading(false);
        setCommitSuccess(false);
      }
    };
    void fetchDocs();
  }, [accounts, id, instance, commitSuccess]);

  // Without this the controller stored below is never aborted, so the progress poll never sees
  // `signal.aborted`, outlives the component, and against a failing endpoint keeps retrying.
  useEffect(
    () => () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    },
    []
  );

  const startLongPolling = useCallback(
    async (uploadId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      const client = new ProgressClient();
      const tokenResult = await instance.acquireTokenSilent(
        silentRequestFor(accounts[0])
      );
      client.setAuthToken(tokenResult.accessToken);
      await pollUploadProgress({
        client,
        uploadId,
        signal: controller.signal,
        onProgress: setProgress,
        onFinished: () => setUploading(false),
      });
    },
    [accounts, instance]
  );

  const handleCancelFile = async (fileName: string) => {
    if (!uploadIdRef.current) return;
    try {
      const client = new ProgressClient();
      const tokenResult = await instance.acquireTokenSilent(
        silentRequestFor(accounts[0])
      );
      client.setAuthToken(tokenResult.accessToken);
      await client.cancelFile(uploadIdRef.current, fileName);
    } catch {
      // Cancellation is best-effort; progress polling will reflect the final state
    }
  };

  const onUploadAttachments = async (
    token: string,
    fileData: FileParameter[]
  ): Promise<AttachmentDto[]> => {
    let attachments = [] as AttachmentDto[];
    try {
      const clientProgress = new ProgressClient();
      clientProgress.setAuthToken(token);
      const uploadId = await clientProgress.getProgressUploadId();
      uploadIdRef.current = uploadId;
      if (uploadIdRef.current) {
        void startLongPolling(uploadIdRef.current);
      }
      const clientPA = new RequestForPatternApprovalClient();
      clientPA.setAuthToken(token);
      const result = await clientPA.addDocuments(
        id,
        null,
        uploadId,
        fileData,
        null,
        null
      );
      const { documents } = result.form || {};
      uploadIdRef.current = result.uploadId!;

      attachments =
        documents?.map(
          (x) =>
            ({
              id: x.id,
              documentReference: x.id,
              attachmentType: x.attachmentType,
              attachmentMimeType: x.attachmentMimeType,
              attachmentSize: x.attachmentSize,
              attachmentName: x.attachmentName,
              attachmentUrl: x.attachmentUrl,
              attachmentCategory: x.attachmentCategory,
              parentTimeStamp: new Date().toDateString(),
              documentLocked: x.documentLocked,
              documentBytes: x.documentBytes,
            }) as AttachmentDto
        ) ?? [];
      setFilesToCommit(attachments.some((doc) => !doc.documentLocked));
    } catch (error) {
      AppLogger.error('Failed to load application documents', error as Error, {
        Id: id,
      });
    }
    return attachments;
  };

  const onSubmit = async (values: AppDocumentsFormValues) => {
    try {
      setIsDataLoading(true);
      const client = new RequestForPatternApprovalClient();
      const tokenResult = await instance.acquireTokenSilent(
        silentRequestFor(accounts[0])
      );
      client.setAuthToken(tokenResult.accessToken);
      // Clear out bytes to avoid unnecessarily large payloads
      const payload: SupportingDocumentsStep = {
        ...values,
        form: {
          ...values.form,
          documents: values.form.documents.map((doc) => ({
            ...doc,
            documentBytes: undefined,
          })),
        },
      };
      await client.commitAppDocuments(id!, payload);
      setCommitSuccess(true);
    } catch (e: unknown) {
      const status = (e as { status?: number } | undefined)?.status;

      if (status === 403) {
        setSubmitErrors([
          'Upload blocked for security reasons. Please rename the file and try again. If the issue continues, contact support.',
        ]);
      } else if (status && status >= 500) {
        setSubmitErrors(['A server error occurred. Please try again.']);
      } else {
        setSubmitErrors(['Failed to commit documents.']);
      }

      AppLogger.error('Failed to load application documents', e as Error, {
        Id: id,
        Status: status,
      });
    } finally {
      setIsDataLoading(false);
    }
  };

  // `values` re-syncs the form when the saved documents change, like Formik's
  // `enableReinitialize`.
  const methods = useForm<AppDocumentsFormValues>({
    values: {
      form: {
        documents: filesUploaded?.form?.documents || [],
        instrumentCategory:
          filesUploaded?.form?.instrumentCategory || undefined,
        instrumentType: filesUploaded?.form?.instrumentType || undefined,
      },
    },
    resolver: createSaveAwareYupResolver<AppDocumentsFormValues>(
      undefined,
      supportingDocsSubmitValidation
    ),
  });

  return (
    <Row className='mb-4' id='application-documents'>
      <Col aria-busy={isDataLoading} aria-live='polite'>
        {isDataLoading ? (
          <BlockUISpinner>
            <p>Loading...</p>
          </BlockUISpinner>
        ) : (
          <div className='appl-items mb-5'>
            <h2 className='visually-hidden'>Documents</h2>
            <FormProvider {...methods}>
              <RhfSupportingDocuments
                isSummary={false}
                suppressDocChanges
                name='form.documents'
                onUploadAttachment={onUploadAttachments}
                attachment={{
                  onUploadFiles: () => Promise.resolve([]), // Not used
                }}
                progress={progress}
                setProgress={setProgress}
                uploading={uploading}
                handleCancelFile={handleCancelFile}
                disableUpload={
                  filesUploaded?.form?.applicationStatus === 'Completed' ||
                  false
                }
                externalErrors={submitErrors}
                setExternalErrors={setSubmitErrors}
              />
              <Row>
                <Col md={12} className='text-end'>
                  {!isDataLoading && filesToCommit && (
                    <Button
                      variant='primary'
                      onClick={(e) => {
                        e.preventDefault();
                        void methods.handleSubmit(onSubmit)();
                      }}
                    >
                      Commit
                    </Button>
                  )}
                </Col>
              </Row>
            </FormProvider>
          </div>
        )}
      </Col>
    </Row>
  );
};

export default ApplicationDocuments;
