import { Alert, Col, Row } from 'react-bootstrap';
import { useEffect, useState, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { useParams } from 'react-router';
import { get } from 'lodash';
import { useFormContext, useWatch } from 'react-hook-form';
import { type TASupportingDocumentsProps, ValidationMessages } from './types';
import {
  getFailedFileErrors,
  handleAlertScroll,
} from './supportingDocumentsHelpers';
import {
  type AttachmentDto,
  type FileParameter,
  PatternApprovalRequiredValues,
  type ProblemDetails,
  RequestForPatternApprovalClient,
  type SupportingDocumentsStep,
} from '../../api/web-api-client';
import { HttpStatusCode } from '../../types';
import { silentRequestFor } from '../../authentication/silentRequest';
import useAccountContext, {
  useAccountDispatch,
} from '../../authentication/hooks';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import RhfAttachment from '../../components/Inputs/RhfAttachment';
import InstrumentInfoPanel from './instrumentInfoPanel';

const ALLOWED_FILE_TYPES =
  '.pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png, .txt, .rtf, .odt, .gif, .csv';

/**
 * React Hook Form counterpart of `SupportingDocuments`. Same props and upload
 * behavior, but it reads the form through `useFormContext`, so it must render
 * inside a `FormProvider`.
 */
const RhfSupportingDocuments = (
  props: Readonly<
    TASupportingDocumentsProps & {
      onDeleteSuccess?: (success: boolean) => void;
    }
  >
) => {
  const { accounts, instance } = useMsal();
  const [noThirdPartyAccess, setNoThirdPartyAccess] = useState(false);
  const accountContext = useAccountContext();
  const accountDispatch = useAccountDispatch();
  const { id } = useParams();
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const {
    formState: { errors: formErrors, submitCount },
    clearErrors,
  } = useFormContext<SupportingDocumentsStep>();
  const formData = useWatch<SupportingDocumentsStep>();

  const {
    attachment,
    onUploadAttachment,
    isSummary,
    name,
    progress,
    setProgress,
    uploading,
    handleCancelFile,
    onDeleteSuccess,
    disableUpload,
    suppressDocChanges,
    externalErrors = [],
    setExternalErrors,
  } = props;

  // Filter out upload errors that are handled by form validation
  const filteredUploadErrors = uploadErrors.filter(
    (err) =>
      err !== ValidationMessages.RequiredDoc &&
      err !== ValidationMessages.RequiredTag
  );

  const validationMessage: unknown = get(formErrors, name)?.message;
  const formFieldErrors =
    typeof validationMessage === 'string' ? [validationMessage] : [];
  const fileErrors = getFailedFileErrors(progress);
  const errors = Array.from(
    new Set([
      ...filteredUploadErrors,
      ...formFieldErrors,
      ...fileErrors,
      ...externalErrors,
    ])
  );

  // Only allow handleAlertScroll to run once
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (
      !hasScrolledRef.current &&
      errors.includes(ValidationMessages.RequiredDoc)
    ) {
      handleAlertScroll();
      hasScrolledRef.current = true;
    }
  }, [errors]);

  useEffect(
    () => () => {
      if (!uploading) {
        setProgress?.(undefined);
      }
    },
    [setProgress, uploading]
  );

  const uploadAttachment = async (
    files: File[],
    uploadFunc: (
      token: string,
      fileData: FileParameter[]
    ) => Promise<AttachmentDto[]>
  ) => {
    if (files.length === 0) {
      throw new Error('No file to upload');
    }

    clearErrors();
    setExternalErrors?.([]);

    const tokenResult = await instance.acquireTokenSilent(
      silentRequestFor(accounts[0])
    );

    const fileDataArray: FileParameter[] = files.map((file) => ({
      data: file,
      fileName: file.name,
    }));

    let result: AttachmentDto[] = [];
    try {
      // Call uploadFunc ONCE with all files
      result = await uploadFunc(tokenResult.accessToken, fileDataArray);
      return result;
    } catch (error: unknown) {
      const uploadServerError = error as ProblemDetails;
      if (
        uploadServerError.status === HttpStatusCode.Forbidden &&
        uploadServerError.title?.includes('No third-party access')
      ) {
        setNoThirdPartyAccess(true);
      } else if (uploadServerError['errors']) {
        // If server returns error messages, set as upload errors (strings only)
        const flatErrors = Object.values(uploadServerError['errors']).flat();
        setUploadErrors(
          flatErrors.filter((e): e is string => typeof e === 'string')
        );
      } else if (uploadServerError.title) {
        setUploadErrors([uploadServerError.title]);
      }
    }
    return result;
  };

  const onUpload = onUploadAttachment
    ? (files: File[]) => uploadAttachment(files, onUploadAttachment)
    : attachment.onUploadFiles;

  if (noThirdPartyAccess) {
    setDashboardNotification({
      message: `You no longer have access to the records
          for ${accountContext?.details?.targetOrganisation?.targetOrganisationName}
          . Your changes have not been saved.`,
      severity: NotificationSeverity.Error,
    });
    accountDispatch?.setTargetOrganisation(
      accountContext?.details?.abn ?? '',
      accountContext?.details?.organisation ?? ''
    );
  }

  const onDeleteAttachment = async (docId: string) => {
    const client = new RequestForPatternApprovalClient();
    const tokenResult = await instance.acquireTokenSilent(
      silentRequestFor(accounts[0])
    );

    client.setAuthToken(tokenResult.accessToken);
    await client.deleteDocument(id, docId);
    if (onDeleteSuccess) onDeleteSuccess(true);
  };

  const onCategoryUpdate = async (docId: string, category: string) => {
    if (!id || !category) return;
    const client = new RequestForPatternApprovalClient();
    const tokenResult = await instance.acquireTokenSilent(
      silentRequestFor(accounts[0])
    );
    client.setAuthToken(tokenResult.accessToken);
    await client.updateCategory(id, docId, category);
  };

  const renderInstrumentInfoPanel = () => {
    const instrumentCategoryId = formData.form?.instrumentCategory as
      string | undefined;
    const instrumentTypeId = formData.form?.instrumentType as
      string | undefined;
    const patternApprovalType = formData.form?.patternApprovalType as
      PatternApprovalRequiredValues | undefined;
    const isVisibilityApplicationType =
      patternApprovalType === PatternApprovalRequiredValues.NewCertificate;
    return (
      isVisibilityApplicationType &&
      instrumentCategoryId &&
      instrumentTypeId && (
        <InstrumentInfoPanel
          name='InstrumentInfo'
          selectedInstrumentCategoryId={instrumentCategoryId}
          selectedInstrumentTypeId={instrumentTypeId}
          isNewCustomer
        />
      )
    );
  };

  const onlyHasCategoryError =
    errors.length === 1 &&
    errors[0] === ValidationMessages.RequiredTag &&
    submitCount === 0;

  return (
    <>
      {!onlyHasCategoryError && errors.length > 0 && (
        <Alert
          variant='danger'
          role='alert'
          aria-live='assertive'
          className='d-flex'
          id='form-error-summary-custom'
        >
          <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
            <div className='bgCircle me-3'>
              <i className='icon-warning' aria-hidden='true' />
            </div>
          </div>
          <div>
            <span className='text-danger fw-bold'>
              <ul className='mb-0'>
                {errors.map((err, idx) => {
                  // Only show the 'documents' error if submitCount is 0
                  if (
                    err === ValidationMessages.RequiredTag &&
                    submitCount === 0
                  ) {
                    return null;
                  }
                  return <li key={`err${idx.toString()}`}>{err}</li>;
                })}
              </ul>
            </span>
          </div>
        </Alert>
      )}
      {!isSummary
        ? // TO DO - This should be a component based on p2 Instrument Category and Type
          renderInstrumentInfoPanel()
        : null}

      <Row className='mb-4'>
        <Col>
          {!suppressDocChanges ? (
            <p>
              After your application has been submitted and assigned to a
              Pattern Approval Engineer, you may be asked to provide additional
              documents.
            </p>
          ) : (
            <p>
              You can use this section to upload additional documents or view
              documents provided by NMI. Documents cannot be changed once
              committed.
            </p>
          )}
        </Col>
      </Row>

      <Row className='mb-4'>
        <h2 className={isSummary ? 'h4 my-3' : 'h4 mb-0'}>
          {!isSummary ? 'Upload one or more' : 'Uploaded'}
          {' supporting documents'}
        </h2>
      </Row>
      <Row>
        <Col>
          <RhfAttachment
            name={name}
            label='Drag and drop files here or'
            ariaLabel='click browse files to choose uploads'
            allowedTypes={ALLOWED_FILE_TYPES}
            inlineHelp=''
            allowMultiple
            className='drag-and-drop-target'
            isSummary={isSummary}
            maxFiles={50}
            maxSizeInMB={25}
            onUploadFiles={onUpload}
            onDeleteFile={onDeleteAttachment}
            progress={progress}
            handleCancelFile={handleCancelFile}
            setErrors={setUploadErrors}
            onCategoryUpdate={onCategoryUpdate}
            disableUpload={disableUpload}
          />
        </Col>
      </Row>
    </>
  );
};

export default RhfSupportingDocuments;
