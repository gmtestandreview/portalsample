import { map } from 'lodash';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { useController } from 'react-hook-form';
import type {
  AttachmentDto,
  ProblemDetails,
} from '../../../api/web-api-client';
import { formatBytes } from '../../../utils';
import BlockUISpinner from '../../BlockUISpinner';
import type { AttachmentProps } from '../Attachment/types';
import RhfAttachmentItem from './RhfAttachmentItem';
import ProgressBar from '../../Progress/ProgressBar';
import ProgressFileList from '../../Progress/ProgressFileList';
import { omitUndefined } from '../../../utils/omitUndefined';

const isAllowedFile = (file: File, allowedTypes: string[]) =>
  file.name.includes('.') &&
  allowedTypes.includes(`.${file.name.split('.').pop()!}`);

/** Returns one message per disallowed file, plus one if too many files were chosen. */
const getUploadValidationErrors = (
  files: File[],
  allowedTypes: string[],
  maxFiles: number
): string[] => {
  const typeError =
    `${files.length > 1 ? 'Files' : 'File'} must be` +
    ` ${allowedTypes.length > 1 ? 'one of the following types' : 'of the following type'}:` +
    ` ${allowedTypes.join(', ')}`;
  const errors = files
    .filter((file) => !isAllowedFile(file, allowedTypes))
    .map(() => typeError);

  if (files.length > maxFiles) {
    errors.push(
      `The files selected have not been uploaded as you have selected more files than the maximum number allowed - (${maxFiles}).`
    );
  }
  return errors;
};

/**
 * React Hook Form counterpart of `AttachmentNew`. It reads the attachment list
 * through `useController`, so it must render inside a `FormProvider`. The
 * field always holds a list, even when only one file is allowed.
 */
const RhfAttachment = (props: Readonly<AttachmentProps>) => {
  const {
    id,
    name,
    allowMultiple,
    maxFiles,
    allowedTypes,
    maxSizeInMB,
    inlineHelp,
    isSummary,
    label,
    ariaLabel,
    buttonTitle,
    containerClassName,
    className,
    onUploadFiles,
    onDeleteFile,
    progress,
    handleCancelFile,
    setErrors,
    onCategoryUpdate,
    disableUpload,
  } = props;

  const { field, fieldState, formState } = useController({ name });
  const value: unknown = field.value;
  // A form may hand us a bare object or null; normalise once so every reader
  // below, and each item's `name.index.category` path, sees a list.
  const attachments: AttachmentDto[] = Array.isArray(value) ? value : [];
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const unidentifiedAttachmentKeys = useRef(
    new WeakMap<AttachmentDto, string>()
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  const addErrors = (messages: string[]) =>
    setErrors((newErrors) => [...newErrors, ...messages]);

  const clearFileInput = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const uploadFiles = async (files: File[]) => {
    const result = await onUploadFiles(files);
    field.onChange([...(result as AttachmentDto[])]);
  };

  const uploadSelectedFiles = async (files: File[]) => {
    const oversizeFiles = files.filter((file) => file.size > maxSizeInBytes);
    addErrors(
      oversizeFiles.map(
        (file) =>
          `Upload failed: ${file.name} exceeds the ${formatBytes(maxSizeInBytes)} limit.`
      )
    );

    if (files.length === 1) {
      if (oversizeFiles.length === 0) {
        await uploadFiles(files);
        clearFileInput();
      }
      return;
    }

    await uploadFiles(files.filter((file) => file.size <= maxSizeInBytes));
  };

  const onInputFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setErrors([]);
    setIsUploading(true);
    if (event.currentTarget.files !== null) {
      const files = Array.from(event.currentTarget.files);
      const allowedTypeList = allowedTypes
        .split(',')
        .map((type) => type.trim());
      const validationErrors = getUploadValidationErrors(
        files,
        allowedTypeList,
        maxFiles
      );

      if (validationErrors.length > 0) {
        addErrors(validationErrors);
      } else {
        try {
          await uploadSelectedFiles(files);
        } catch (error_) {
          addErrors(
            map((error_ as ProblemDetails)['errors'], (error) => error)
          );
        }
      }
    }
    setIsUploading(false);
  };

  const onConfirmDeleteFile = async (attachment: AttachmentDto) => {
    setErrors([]);
    setIsDeleting(true);
    try {
      if (attachment.id) {
        await onDeleteFile(attachment.id);
        field.onChange(
          attachments.filter((item: AttachmentDto) => item.id !== attachment.id)
        );
        clearFileInput();
      }
    } catch (error_) {
      setErrors((newErrors) => [...newErrors, `${error_}`]);
    }
    setIsDeleting(false);
  };

  const renderAttachments = () =>
    attachments.map((attachment, i) => {
      let attachmentKey =
        attachment.id ?? unidentifiedAttachmentKeys.current.get(attachment);
      if (attachmentKey === undefined) {
        attachmentKey = globalThis.crypto.randomUUID();
        unidentifiedAttachmentKeys.current.set(attachment, attachmentKey);
      }
      return (
        <RhfAttachmentItem
          key={attachmentKey}
          attachment={attachment}
          {...omitUndefined({ onCategoryUpdate })}
          name={name}
          index={i}
          canRemove={!isSummary && !attachment.documentLocked}
          cancelButtonId={`cancel-button-${attachment.id}`}
          onRemoveItem={onConfirmDeleteFile}
          isSummary={isSummary || !!attachment.documentLocked}
        />
      );
    });

  if (isSummary) {
    return attachments.length > 0 ? (
      <div className='attachments-summary'>{renderAttachments()}</div>
    ) : (
      <span>No details added</span>
    );
  }

  const controlId = id ?? name;

  return (
    <>
      <div
        className={`form-field-container position-relative ${containerClassName || ''}`}
      >
        {isDeleting && (
          <BlockUISpinner>
            <p>Deleting...</p>
          </BlockUISpinner>
        )}

        <Row className='mb-4'>
          <Col>
            <div
              className={`position-relative text-center mb-3 p-4 ${className}`}
            >
              <span className='d-block text-center'>
                <i className='icon-file fs-1' aria-hidden='true' />
              </span>
              <Form.Label
                htmlFor={`drag-upload-${controlId}`}
                className='mb-0 text-center'
                onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) =>
                  e.preventDefault()
                }
                aria-label={ariaLabel}
              >
                {label}
              </Form.Label>
              <div
                id={`help-${controlId}`}
                className='contextual-help form-text text-center'
              >
                {inlineHelp}
              </div>
              <input
                disabled={disableUpload}
                ref={inputRef}
                id={`drag-upload-${controlId}`}
                data-testid={`drag-upload-${controlId}`}
                type='file'
                accept={allowedTypes}
                multiple={allowMultiple === true ? true : undefined}
                readOnly
                tabIndex={0}
                title={
                  disableUpload
                    ? 'Drag files disabled'
                    : buttonTitle || 'Drag files here'
                }
                // TO DO: Move the inline style into own class
                className='position-absolute top-0 start-0 w-100 h-100 opacity-0'
                style={{
                  cursor: 'grab',
                  zIndex: 2,
                }}
                onChange={onInputFileChange}
              />
              <input
                disabled={disableUpload}
                type='button'
                id={controlId}
                name={name}
                data-testid={controlId}
                value={buttonTitle || 'Browse files'}
                // TO DO: Move the inline style into own class
                className='d-flex d-md-inline-block gap-2 position-relative btn btn-nmi-secondary flex-grow-1 mx-auto mb-2'
                style={{ zIndex: 3 }}
                aria-describedby={
                  (fieldState.isTouched || formState.isSubmitted) &&
                  fieldState.error
                    ? `${controlId}-validation-msg`
                    : `help-${controlId}`
                }
                onClick={() => {
                  inputRef.current?.click();
                }}
              />
            </div>
            <div>
              <p className='small'>
                <span className='text-right'>
                  <strong>{'Maximum size for each file: '}</strong>
                  {maxSizeInMB}
                  MB each
                </span>
                <br />
                <span>
                  <strong>{'Accepted file types: '}</strong>
                  <span>{allowedTypes}</span>
                </span>
              </p>
            </div>
          </Col>
        </Row>
      </div>
      {isUploading && (
        <div
          className='d-flex justify-content-center align-items-center my-3'
          role='status'
          aria-live='polite'
        >
          <span className='spinner-border spinner-border-sm text-primary' />
          <span className='ms-2'>Loading...</span>
        </div>
      )}
      {progress &&
      progress.status !== 'Completed' &&
      progress.status !== 'CompletedWithErrors' ? (
        <Col role='status' aria-live='polite'>
          <ProgressBar percent={progress.percent!} status={progress.status!} />
          <p className='mt-2 mb-4 ms-1 text-muted small'>
            {progress.completedFiles}
            {' / '}
            {progress.totalFiles}
            {' files processed'}
          </p>
          <ProgressFileList
            files={progress.files!}
            {...omitUndefined({ onCancelFile: handleCancelFile })}
          />
        </Col>
      ) : (
        attachments.length > 0 && (
          <Row className='mb-4'>
            <h3 className='h4 mb-1'>
              {attachments.length}
              {' files uploaded'}
            </h3>
            <p className='h6 mb-3'>
              Select a category to classify each document
            </p>
            <Col id='file-upload-attachments'>{renderAttachments()}</Col>
          </Row>
        )
      )}
    </>
  );
};

export default RhfAttachment;
