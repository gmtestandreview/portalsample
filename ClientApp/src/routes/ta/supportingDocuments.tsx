import { Alert, Col, Row } from 'react-bootstrap';
import {
  useEffect,
  useState,
  useRef,
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useMsal } from '@azure/msal-react';
import { useParams } from 'react-router';
import { useFormikContext } from 'formik';
import { type TASupportingDocumentsProps, ValidationMessages } from './types';
import {
  getFailedFileErrors,
  handleAlertScroll,
} from './supportingDocumentsHelpers';
import {
  type AttachmentDto,
  type FileParameter,
  PatternApprovalRequiredValues,
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
import AttachmentNew from '../../components/Inputs/Attachment/index-new';
import InstrumentInfoPanel from './instrumentInfoPanel';

const isString = (e: unknown): e is string => typeof e === 'string';

interface UploadProblemDetails {
  status?: number;
  title?: string;
  errors?: Record<string, unknown[]>;
}

type MsalContext = ReturnType<typeof useMsal>;
type UploadFunction = (
  token: string,
  fileData: FileParameter[],
) => Promise<AttachmentDto[]>;

interface UploadAttachmentDependencies {
  accounts: MsalContext['accounts'];
  instance: MsalContext['instance'];
  clearFormikErrors: () => void;
  setExternalErrors?: TASupportingDocumentsProps['setExternalErrors'];
  setNoThirdPartyAccess: Dispatch<SetStateAction<boolean>>;
  setUploadErrors: Dispatch<SetStateAction<string[]>>;
}

interface DocumentOperationDependencies {
  accounts: MsalContext['accounts'];
  instance: MsalContext['instance'];
  id: string | undefined;
}

interface DeleteDocumentDependencies extends DocumentOperationDependencies {
  onDeleteSuccess: ((success: boolean) => void) | undefined;
}

type SupportingDocumentsAttachmentProps = Pick<
  ComponentProps<typeof AttachmentNew>,
  | 'name'
  | 'allowedTypes'
  | 'isSummary'
  | 'onUploadFiles'
  | 'onDeleteFile'
  | 'progress'
  | 'handleCancelFile'
  | 'setErrors'
  | 'onCategoryUpdate'
  | 'disableUpload'
> & {
  suppressDocChanges: boolean | undefined;
};

const EMPTY_EXTERNAL_ERRORS: string[] = [];
const REQUIRED_DOCUMENT_ERROR: string = ValidationMessages.RequiredDoc;
const REQUIRED_TAG_ERROR: string = ValidationMessages.RequiredTag;

/** Normalises Formik's string | string[] | nested-object error for one field to string[]. */
const getFormikFieldErrors = (fieldError: unknown, errorName: string) => {
  if (!fieldError) return [];
  if (typeof fieldError === 'string') return [fieldError];
  if (Array.isArray(fieldError))
    return (fieldError as unknown[]).filter(isString);
  if (typeof fieldError !== 'object') return [];
  const fieldErrorRecord = fieldError as Record<string, unknown>;
  const nestedError = Object.hasOwn(fieldErrorRecord, errorName)
    ? Reflect.get(fieldErrorRecord, errorName)
    : undefined;
  return [nestedError ?? ''].filter(isString);
};

const renderInstrumentInfoPanel = (formData: SupportingDocumentsStep) => {
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
        isNewCustomer
      />
    )
  );
};

const uploadSupportingDocuments = async (
  {
    accounts,
    instance,
    clearFormikErrors,
    setExternalErrors,
    setNoThirdPartyAccess,
    setUploadErrors,
  }: UploadAttachmentDependencies,
  files: File[],
  uploadFunc: UploadFunction,
) => {
  if (files.length === 0) {
    throw new Error('No file to upload');
  }

  clearFormikErrors();
  setExternalErrors?.([]);

  const tokenResult = await instance.acquireTokenSilent(
    silentRequestFor(accounts[0]),
  );

  const fileDataArray: FileParameter[] = files.map((file) => ({
    data: file,
    fileName: file.name,
  }));

  let result: AttachmentDto[] = [];
  try {
    result = await uploadFunc(tokenResult.accessToken, fileDataArray);
    return result;
  } catch (error: unknown) {
    const uploadServerError = error as UploadProblemDetails;
    if (
      uploadServerError.status === HttpStatusCode.Forbidden &&
      uploadServerError.title?.includes('No third-party access')
    ) {
      setNoThirdPartyAccess(true);
    } else if (uploadServerError.errors) {
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

const deleteSupportingDocument = async (
  { accounts, instance, id, onDeleteSuccess }: DeleteDocumentDependencies,
  docId: string,
) => {
  const client = new RequestForPatternApprovalClient();
  const tokenResult = await instance.acquireTokenSilent(
    silentRequestFor(accounts[0]),
  );

  client.setAuthToken(tokenResult.accessToken);
  await client.deleteDocument(id, docId);
  if (onDeleteSuccess) onDeleteSuccess(true);
};

const updateSupportingDocumentCategory = async (
  { accounts, instance, id }: DocumentOperationDependencies,
  docId: string,
  category: string,
) => {
  if (!id || !category) return;
  const client = new RequestForPatternApprovalClient();
  const tokenResult = await instance.acquireTokenSilent(
    silentRequestFor(accounts[0]),
  );
  client.setAuthToken(tokenResult.accessToken);
  await client.updateCategory(id, docId, category);
};

const notifyNoThirdPartyAccess = (
  accountContext: ReturnType<typeof useAccountContext>,
  accountDispatch: ReturnType<typeof useAccountDispatch>,
) => {
  setDashboardNotification({
    message: `You no longer have access to the records
          for ${accountContext?.details?.targetOrganisation?.targetOrganisationName ?? ''}
          . Your changes have not been saved.`,
    severity: NotificationSeverity.Error,
  });
  accountDispatch?.setTargetOrganisation(
    accountContext?.details?.abn ?? '',
    accountContext?.details?.organisation ?? '',
  );
};

interface SupportingDocumentsErrorSummaryProps {
  errors: string[];
  onlyHasCategoryError: boolean;
  submitCount: number;
}

const SupportingDocumentsErrorSummary = ({
  errors,
  onlyHasCategoryError,
  submitCount,
}: SupportingDocumentsErrorSummaryProps) => {
  if (onlyHasCategoryError || errors.length === 0) return null;

  return (
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
              if (
                typeof err === 'string' &&
                err === REQUIRED_TAG_ERROR &&
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
  );
};

const SupportingDocumentsContent = ({
  suppressDocChanges,
  name,
  allowedTypes,
  isSummary,
  onUploadFiles,
  onDeleteFile,
  progress,
  handleCancelFile,
  setErrors,
  onCategoryUpdate,
  disableUpload,
}: SupportingDocumentsAttachmentProps) => (
  <>
    <Row className='mb-4'>
      <Col>
        {!suppressDocChanges ? (
          <p>
            After your application has been submitted and assigned to a Pattern
            Approval Engineer, you may be asked to provide additional documents.
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
          allowedTypes={allowedTypes}
          inlineHelp=''
          allowMultiple
          className='drag-and-drop-target'
          isSummary={isSummary}
          maxFiles={50}
          maxSizeInMB={25}
          onUploadFiles={onUploadFiles}
          onDeleteFile={onDeleteFile}
          progress={progress}
          handleCancelFile={handleCancelFile}
          setErrors={setErrors}
          onCategoryUpdate={onCategoryUpdate}
          disableUpload={disableUpload}
        />
      </Col>
    </Row>
  </>
);

const SupportingDocuments = (
  props: Readonly<
    TASupportingDocumentsProps & {
      onDeleteSuccess?: (success: boolean) => void;
    }
  >,
) => {
  const { accounts, instance } = useMsal();
  const [noThirdPartyAccess, setNoThirdPartyAccess] = useState(false);
  const accountContext = useAccountContext();
  const accountDispatch = useAccountDispatch();
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
    externalErrors = EMPTY_EXTERNAL_ERRORS,
    setExternalErrors,
  } = props;

  // Filter out upload errors that are handled by Formik
  const filteredUploadErrors = uploadErrors.filter(
    (err) => err !== REQUIRED_DOCUMENT_ERROR && err !== REQUIRED_TAG_ERROR,
  );

  // e.g. 'supportingDocuments.form.documents' => 'documents'
  const errorName = name.slice(name.lastIndexOf('.') + 1);
  // e.g. 'supportingDocuments.form.documents' => 'supportingDocuments'
  const rootErrorName = name.replace(/\..*$/s, '');
  // Get Formik field errors for this field
  const rootError = Object.hasOwn(formikErrors, rootErrorName)
    ? Reflect.get(formikErrors, rootErrorName)
    : undefined;
  const formikFieldErrors = getFormikFieldErrors(rootError, errorName);
  const fileErrors = getFailedFileErrors(progress);
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
    if (!hasScrolledRef.current && errors.includes(REQUIRED_DOCUMENT_ERROR)) {
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
    [setProgress, uploading],
  );

  const clearFormikErrors = () => {
    setFormikErrors({});
  };
  const onUpload = onUploadAttachment
    ? (files: File[]) =>
        uploadSupportingDocuments(
          {
            accounts,
            instance,
            clearFormikErrors,
            setExternalErrors,
            setNoThirdPartyAccess,
            setUploadErrors,
          },
          files,
          onUploadAttachment,
        )
    : attachment.onUploadFiles;

  if (noThirdPartyAccess) {
    notifyNoThirdPartyAccess(accountContext, accountDispatch);
  }

  const onDeleteAttachment = (docId: string) =>
    deleteSupportingDocument(
      { accounts, instance, id, onDeleteSuccess },
      docId,
    );

  const onCategoryUpdate = (docId: string, category: string) =>
    updateSupportingDocumentCategory(
      { accounts, instance, id },
      docId,
      category,
    );

  const onlyHasCategoryError =
    errors.length === 1 &&
    typeof errors[0] === 'string' &&
    errors[0] === REQUIRED_TAG_ERROR &&
    context.submitCount === 0;

  return (
    <>
      <SupportingDocumentsErrorSummary
        errors={errors}
        onlyHasCategoryError={onlyHasCategoryError}
        submitCount={context.submitCount}
      />
      {!isSummary
        ? // TO DO - This should be a component based on p2 Instrument Category and Type
          renderInstrumentInfoPanel(context.values)
        : null}
      <SupportingDocumentsContent
        suppressDocChanges={suppressDocChanges}
        name={name}
        allowedTypes={allowedFileTypes}
        isSummary={isSummary}
        onUploadFiles={onUpload}
        onDeleteFile={onDeleteAttachment}
        progress={progress}
        handleCancelFile={handleCancelFile}
        setErrors={setUploadErrors}
        onCategoryUpdate={onCategoryUpdate}
        disableUpload={disableUpload}
      />
    </>
  );
};
export default SupportingDocuments;
