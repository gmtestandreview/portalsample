/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMsal } from '@azure/msal-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router';
import { Button, Col, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import type {
  UploadProgress,
  AttachmentDto,
  FileParameter,
  SupportingDocumentsStep,
} from '../../../api/web-api-client';
import {
  ProgressClient,
  RequestForPatternApprovalClient,
} from '../../../api/web-api-client';
import BlockUISpinner from '../../../components/BlockUISpinner';

import { tokenRequest } from '../../../authentication/authConfig';
import AppLogger from '../../../instrumentation/AppLogger';
import SupportingDocuments from '../supportingDocuments';
import { supportingDocsSubmitValidation } from '../validation';

const handleAlertScroll = () => {
  window.scrollTo(0, 0);
  setTimeout(() => {
    const el: HTMLElement = document.querySelector(
      '[id^="#application-documents"]',
    )!;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.focus();
  }, 100);
};

interface ApplicationDocumentsProps {
  onDownloadFile: (fileName: string) => Promise<void>;
}

const ApplicationDocuments = ({
  onDownloadFile,
}: ApplicationDocumentsProps) => {
  const { accounts, instance } = useMsal();
  const { id } = useParams();
  const [isDataLoading, setIsDataLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isModalOpen, setIsModalOpen] = useState(false);

  // SupportingDocuments upload state and handlers (from ta/index.tsx)
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | undefined>(
    undefined,
  );
  const abortRef = useRef<AbortController | null>(null);
  const uploadIdRef = useRef<string | null>(null);

  // State for Formik initialValues (existing docs)
  const [filesUploaded, setFilesUploaded] =
    useState<SupportingDocumentsStep | null>(null);
  const [filesToCommit, setFilesToCommit] = useState<boolean>(false);
  const [commitSuccess, setCommitSuccess] = useState<boolean>(false);
  const [scrollUp, setScrollUp] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const isSubmitted = true; // details.applicationStatus === 'Submitted';

  useEffect(() => {
    const fetchDocs = async () => {
      setIsDataLoading(true);
      try {
        if (accounts.length > 0 && id) {
          const client = new RequestForPatternApprovalClient();
          const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
          });
          client.setAuthToken(tokenResult.accessToken);
          const beforeCall = new Date();
          const response = await client.getAppDocuments(id);
          const afterCall = new Date();
          console.log('addDocuments call duration', {
            duration: afterCall.getTime() - beforeCall.getTime(),
          });
          setFilesUploaded(response);
          setFilesToCommit(
            response?.form?.documents?.some((doc) => !doc.documentLocked) ??
              false,
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
    fetchDocs();

    if (scrollUp) {
      handleAlertScroll();
      setScrollUp(false);
    }

    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [accounts, id, instance, commitSuccess]);

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

          if (
            data.status === 'Completed' ||
            data.status === 'CompletedWithErrors'
          ) {
            setUploading(false);
            client.deleteProgressStatistics(uploadId).catch((error) => {
              AppLogger.error(
                'Failed to delete progress statistics',
                error as Error,
                { uploadId },
              );
            });
            break;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err: any) {
          if (controller.signal.aborted) break;
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
      const beforeCall = new Date();
      const result = await clientPA.addDocuments(
        id,
        null,
        uploadId,
        fileData,
        null,
        null,
      );
      const afterCall = new Date();
      console.log('addDocuments call duration', {
        duration: afterCall.getTime() - beforeCall.getTime(),
      });
      const { documents } = result.form || {};
      uploadIdRef.current = result.uploadId!;

      attachments = [...documents!];

      setFilesToCommit(attachments.some((doc) => !doc.documentLocked));
    } catch (error) {
      AppLogger.error('Failed to load application documents', error as Error, {
        Id: id,
      });
    }
    return attachments;
  };

  return (
    <Row className='mb-4' id='application-documents'>
      <Col
        {...{ inert: isModalOpen ? '' : undefined }}
        aria-busy={!isModalOpen && isDataLoading}
        aria-live={isModalOpen ? undefined : 'polite'}
      >
        {!isModalOpen && isDataLoading ? (
          <BlockUISpinner partial>
            <p>Loading data...</p>
          </BlockUISpinner>
        ) : (
          <div className='appl-items mb-5'>
            <h2 className='visually-hidden'>Documents</h2>
            <Formik
              enableReinitialize
              initialValues={{
                form: {
                  documents: filesUploaded?.form?.documents || [],
                  instrumentCategory:
                    filesUploaded?.form?.instrumentCategory || undefined,
                  instrumentType:
                    filesUploaded?.form?.instrumentType || undefined,
                },
              }}
              validationSchema={supportingDocsSubmitValidation}
              onSubmit={async (values) => {
                try {
                  setIsDataLoading(true);
                  const client = new RequestForPatternApprovalClient();
                  const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                  });
                  client.setAuthToken(tokenResult.accessToken);
                  values.form.documents.forEach((doc) => {
                    doc.documentBytes = undefined; // Clear out bytes to avoid unnecessarily large payloads
                  });
                  await client.commitAppDocuments(id!, values);
                  setCommitSuccess(true);
                } catch (e) {
                  const status = (e as any)?.status as number | undefined;

                  if (status === 403) {
                    setSubmitErrors([
                      'Upload blocked for security reasons. Please rename the file and try again. If the issue continues, contact support.',
                    ]);
                  } else if (status && status >= 500) {
                    setSubmitErrors([
                      'A server error occurred. Please try again.',
                    ]);
                  } else {
                    setSubmitErrors(['Failed to commit documents.']);
                  }

                  AppLogger.error(
                    'Failed to load application documents',
                    e as Error,
                    { Id: id, Status: status },
                  );
                } finally {
                  setIsDataLoading(false);
                }
              }}
            >
              {({ submitForm }) => (
                <>
                  <SupportingDocuments
                    isSummary={false}
                    suppressDocChanges
                    name='form.documents'
                    onUploadAttachment={onUploadAttachments}
                    attachment={{
                      onUploadFiles: () => Promise.resolve([]), // Not used
                    }}
                    onDeleteSuccess={(uploadCount) => {
                      setFilesToCommit(uploadCount > 0);
                      console.log(`Remaining files: ${uploadCount}`);
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
                    isSubmitted={isSubmitted}
                    onDownloadFile={onDownloadFile}
                  />
                  <Row>
                    <Col md={12} className='text-end'>
                      {!isDataLoading && filesToCommit && (
                        <Button
                          variant='primary'
                          onClick={(e) => {
                            e.preventDefault();
                            submitForm();
                          }}
                        >
                          Commit
                        </Button>
                      )}
                    </Col>
                  </Row>
                </>
              )}
            </Formik>
          </div>
        )}
      </Col>
    </Row>
  );
};

export default ApplicationDocuments;
