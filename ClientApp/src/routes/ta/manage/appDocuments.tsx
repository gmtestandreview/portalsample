import { useMsal } from '@azure/msal-react';
import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router';
import { Button, Col, Row } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import {
  type AttachmentDto,
  RequestForPatternApprovalClient,
  type SupportingDocumentsStep,
} from '../../../api/web-api-client';

import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';

import useBodyClass from '../../../components/Utilities/useBodyClass';
import BlockUISpinner from '../../../components/BlockUISpinner';

import { createAuthenticatedClient } from '../../../authentication/authenticatedClient';
import AppLogger from '../../../instrumentation/AppLogger';
import RhfSupportingDocuments from '../rhfSupportingDocuments';
import { createSaveAwareYupResolver } from '../../../components/forms/saveAwareYupResolver';
import { supportingDocsSubmitValidation } from '../validation';
import {
  getUploadErrorDetails,
  useUploadHandlers,
  type UploadHandlers,
} from '../useUploadState';

interface AppDocumentsFormValues {
  form: {
    documents: AttachmentDto[];
    instrumentCategory?: string;
    instrumentType?: string;
  };
}

const ApplicationDocuments = () => {
  const { accounts, instance } = useMsal();
  const { id } = useParams();
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [filesUploaded, setFilesUploaded] =
    useState<SupportingDocumentsStep | null>(null);
  const [filesToCommit, setFilesToCommit] = useState<boolean>(false);
  const [commitSuccess, setCommitSuccess] = useState<boolean>(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  useHtmlTitle(`[New certificate] (${id ?? ''}) manage | NMI Services portal`);
  useBodyClass('pa-application-manage');

  const handleUploadError = useCallback(
    (error: unknown) => {
      AppLogger.error('Failed to load application documents', error as Error, {
        Id: id,
      });
    },
    [id],
  );

  const handleAttachmentsUploaded = useCallback(
    (attachments: AttachmentDto[]) => {
      setFilesToCommit(attachments.some((doc) => !doc.documentLocked));
    },
    [],
  );

  const mapManagedAttachment = useCallback(
    (attachment: AttachmentDto, document: AttachmentDto): AttachmentDto => ({
      ...attachment,
      ...(document.documentLocked === undefined
        ? {}
        : { documentLocked: document.documentLocked }),
      ...(document.documentBytes === undefined
        ? {}
        : { documentBytes: document.documentBytes }),
    }),
    [],
  );

  const uploadHandlers: UploadHandlers = useUploadHandlers({
    accounts,
    instance,
    id,
    onUploadError: handleUploadError,
    mapUploadedDocument: mapManagedAttachment,
    onAttachmentsUploaded: handleAttachmentsUploaded,
  });
  const {
    uploading,
    progress,
    setProgress,
    handleCancelFile,
    onUploadAttachments,
  } = uploadHandlers;

  useEffect(() => {
    const fetchDocs = async () => {
      setIsDataLoading(true);
      try {
        if (accounts.length > 0 && id) {
          const client = await createAuthenticatedClient(
            RequestForPatternApprovalClient,
            accounts,
            instance,
          );
          const response = await client.getAppDocuments(id);
          setFilesUploaded(response);
          setFilesToCommit(
            response.form?.documents?.some((doc) => !doc.documentLocked) ??
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
    void fetchDocs();
  }, [accounts, id, instance, commitSuccess]);

  const onSubmit = async (values: AppDocumentsFormValues) => {
    if (id === undefined) return;
    try {
      setIsDataLoading(true);
      const client = await createAuthenticatedClient(
        RequestForPatternApprovalClient,
        accounts,
        instance,
      );
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
      await client.commitAppDocuments(id, payload);
      setCommitSuccess(true);
    } catch (e: unknown) {
      const { message, status } = getUploadErrorDetails(e);
      setSubmitErrors([message]);

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
        documents: filesUploaded?.form?.documents ?? [],
        ...(filesUploaded?.form?.instrumentCategory
          ? {
              instrumentCategory: filesUploaded.form.instrumentCategory,
            }
          : {}),
        ...(filesUploaded?.form?.instrumentType
          ? {
              instrumentType: filesUploaded.form.instrumentType,
            }
          : {}),
      },
    },
    resolver: createSaveAwareYupResolver<AppDocumentsFormValues>(
      undefined,
      supportingDocsSubmitValidation,
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
                  {filesToCommit && (
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
