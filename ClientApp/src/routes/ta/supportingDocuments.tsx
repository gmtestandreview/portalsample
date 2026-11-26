import { Alert, Col, Row } from 'react-bootstrap';
import { useEffect, useState, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { useParams } from 'react-router';
import { useFormikContext } from 'formik';
import type { TASupportingDocumentsProps } from './types';
import { FileStatus, ValidationMessages } from './types';
import type {
  AttachmentDto,
  FileParameter,
  ProblemDetails,
  SupportingDocumentsStep,
} from '../../api/web-api-client';
import {
  PatternApprovalRequiredValues,
  RequestForPatternApprovalClient,
} from '../../api/web-api-client';
import { HttpStatusCode } from '../../types';
import { tokenRequest } from '../../authentication/authConfig';
import useAccountContext from '../../authentication/hooks';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import AttachmentNew from '../../components/Inputs/Attachment/index-new';
import InstrumentInfoPanel from './instrumentInfoPanel';

const handleAlertScroll = () => {
  setTimeout(() => {
    const summaryRef: HTMLElement = document.querySelector(
      '#form-error-summary-custom',
    )!;
    summaryRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    summaryRef?.focus();
  }, 100);
};

const SupportingDocuments = (
  props: TASupportingDocumentsProps & {
    onDeleteSuccess?: (uploadCount: number) => void;
  },
) => {
  const { accounts, instance } = useMsal();
  const [noThirdPartyAccess, setNoThirdPartyAccess] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [gone, setGone] = useState(false);
  const accountContext = useAccountContext();
  const { id } = useParams();
  const allowedFileTypes =
    '.pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png, .txt, .rtf, .odt, .gif, .csv';
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const { errors: formikErrors, setErrors: setFormikErrors } =
    useFormikContext<any>();
  const context = useFormikContext<SupportingDocumentsStep>();

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
    isSubmitted = false, // default props
    onDownloadFile,
  } = props;

  // Filter out upload errors that are handled by Formik
  const filteredUploadErrors = uploadErrors.filter(
    (err) =>
      err !== ValidationMessages.RequiredDoc &&
      err !== ValidationMessages.RequiredTag,
  );

  const errorNames = name.split('.'); // e.g. 'supportingDocuments.form.documents' => ['supportingDocuments', 'form', 'documents']
  const errorName = errorNames[errorNames.length - 1]; // e.g. 'documents'
  // Get Formik field errors for this field
  let formikFieldErrors: string[] = [];
  if (formikErrors?.[errorNames[0]]) {
    const fieldError = formikErrors[errorNames[0]];
    if (typeof fieldError === 'string') {
      formikFieldErrors = [fieldError];
    } else if (Array.isArray(fieldError)) {
      formikFieldErrors = (fieldError as unknown[]).filter(
        (e): e is string => typeof e === 'string',
      );
    } else if (typeof fieldError === 'object' && fieldError !== null) {
      formikFieldErrors = [fieldError[errorName] || ''].filter(
        (e): e is string => typeof e === 'string',
      );
    }
  }

  const fileErrors: string[] = [];
  if (progress && progress.percent === 100 && Array.isArray(progress.files)) {
    const failedFileErrors = progress.files
      .filter(
        (f) =>
          f.status === FileStatus.Failed || f.status === FileStatus.Cancelled,
      )
      .map((f) => {
        if (f.status === FileStatus.Cancelled) {
          return `Upload cancelled for ${f.fileName}`;
        }
        return `Error uploading ${f.fileName}`;
      });
    fileErrors.push(...failedFileErrors);
  }
  // Combine errors, deduplicated
  const errors = Array.from(
    new Set([
      ...filteredUploadErrors,
      ...formikFieldErrors,
      ...fileErrors,
      ...externalErrors,
    ]),
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
      // console.log('isSubmitted in SupportingDocuments:', isSubmitted);
    },
    [setProgress, uploading],
  );

  const uploadAttachment = async (
    files: File[],
    uploadFunc: (
      token: string,
      fileData: FileParameter[],
    ) => Promise<AttachmentDto[]>,
  ) => {
    if (files.length === 0) {
      throw new Error('No file to upload');
    }

    // setUploadErrors([]);
    setFormikErrors({});
    setExternalErrors?.([]);

    const tokenResult = await instance.acquireTokenSilent({
      ...tokenRequest,
      account: accounts[0],
    });

    // Build the FileParameter array
    const fileDataArray: FileParameter[] = files.map((file) => ({
      data: file,
      fileName: file.name,
    }));

    let result: AttachmentDto[] = [];
    try {
      // Call uploadFunc ONCE with all files
      result = await uploadFunc(tokenResult.accessToken, fileDataArray);
      return result;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const uploadServerError = error as ProblemDetails;
      if (
        uploadServerError.status === HttpStatusCode.Forbidden &&
        uploadServerError.title?.includes('No third-party access')
      ) {
        setNoThirdPartyAccess(true);
      } else if (uploadServerError.status === HttpStatusCode.Gone) {
        setGone(true);
      } else if (uploadServerError.errors) {
        // If server returns error messages, set as upload errors (strings only)
        const flatErrors = Object.values(uploadServerError.errors).flat();
        setUploadErrors(
          flatErrors.filter((e): e is string => typeof e === 'string'),
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
    if (accountContext) {
      accountContext.setTargetOrganisation(
        accountContext?.details?.abn ?? '',
        accountContext?.details?.organisation ?? '',
      );
    }
  }

  const onDeleteAttachment = async (docId: string, uploadCount: number) => {
    const client = new RequestForPatternApprovalClient();
    const tokenResult = await instance.acquireTokenSilent({
      ...tokenRequest,
      account: accounts[0],
    });

    client.setAuthToken(tokenResult.accessToken);
    await client.deleteDocument(id, docId);
    if (onDeleteSuccess) onDeleteSuccess(uploadCount);
    return Promise.resolve();
  };

  const onCategoryUpdate = async (docId: string, category: string) => {
    if (!id || !category) return Promise.resolve();
    const client = new RequestForPatternApprovalClient();
    const tokenResult = await instance.acquireTokenSilent({
      ...tokenRequest,
      account: accounts[0],
    });
    client.setAuthToken(tokenResult.accessToken);
    await client.updateCategory(id, docId, category);
    return Promise.resolve();
  };

  const renderInstrumentInfoPanel = () => {
    const formData = context.values;
    const instrumentCategoryId = formData.form?.instrumentCategory;
    const instrumentTypeId = formData.form?.instrumentType;
    const patternApprovalType = formData.form?.patternApprovalType;
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
          isNewCustomer={true}
        />
      )
    );
  };

  const onlyHasCategoryError =
    errors.length === 1 &&
    typeof errors[0] === 'string' &&
    errors[0] === ValidationMessages.RequiredTag &&
    context.submitCount === 0;

  return (
    <>
      {!onlyHasCategoryError && errors && errors.length > 0 && (
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
                    typeof err === 'string' &&
                    err === ValidationMessages.RequiredTag &&
                    context.submitCount === 0
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

      <Row className={isSummary ? 'mb-0' : 'mb-4'}>
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
          <AttachmentNew
            name={name}
            label='Drag and drop files here or'
            ariaLabel='click browse files to choose uploads'
            allowedTypes={allowedFileTypes}
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
            isSubmitted={isSubmitted}
            onDownloadFile={onDownloadFile}
          />
        </Col>
      </Row>
    </>
  );
};
export default SupportingDocuments;
