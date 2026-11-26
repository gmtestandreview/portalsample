import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { useController, useFormContext } from 'react-hook-form';
import type { AttachmentDto } from '../../../api/web-api-client';
import { formatBytes } from '../../../utils';
import BlockUISpinner from '../../BlockUISpinner';
import type { AttachmentProps } from '../Attachment/types';
import RhfAttachmentItem from './RhfAttachmentItem';
import ProgressBar from '../../Progress/ProgressBar';
import ProgressFileList from '../../Progress/ProgressFileList';
import { omitUndefined } from '../../../utils/omitUndefined';
import {
  CATEGORY_OPTIONS,
  categoryPath,
  createMutationGate,
  matchesSnapshot,
  readAttachments,
  remainingUnlockedCount,
  sameUnidentifiedAttachment,
  snapshotAttachments,
  validateSelection,
} from './attachmentContracts';

/** RHF uses DTO arrays for new writes; legacy scalar reads retain their actual path. */
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
    className = '',
    onUploadFiles,
    onDeleteFile,
    progress,
    handleCancelFile,
    setErrors,
    onCategoryUpdate,
    disableUpload,
    isSubmitted = false,
    onDownloadFile,
  } = props;
  const { field, fieldState, formState } = useController({ name });
  const { getValues, setValue } = useFormContext();
  const collection = readAttachments(field.value);
  const { items: attachments } = collection;
  const [operation, setOperation] = useState<
    'upload' | 'delete' | 'category' | null
  >(null);
  const gate = useRef(createMutationGate());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const unidentifiedKeys = useRef(new WeakMap<AttachmentDto, string>());
  const keyCounter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  const progressActive =
    !!progress &&
    progress.status !== 'Completed' &&
    progress.status !== 'CompletedWithErrors';
  const busy = operation !== null;
  const isUploading = operation === 'upload';
  const isDeleting = operation === 'delete';
  const controlId = id ?? name;
  const showFieldError =
    !!fieldState.error && (fieldState.isTouched || formState.isSubmitted);
  const describedBy = !collection.valid
    ? `${controlId}-attachment-state-error`
    : showFieldError
      ? `${controlId}-validation-msg`
      : `help-${controlId}`;

  const addErrors = (messages: string[]) => {
    if (mounted.current && messages.length)
      setErrors((current) => [...current, ...messages]);
  };
  const reportError = (message: string) => {
    if (mounted.current)
      setErrors((current) =>
        current.includes(message) ? current : [...current, message],
      );
  };
  const clearFileInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };
  const begin = (kind: NonNullable<typeof operation>) => {
    if (
      isSummary ||
      progressActive ||
      !mounted.current ||
      !gate.current.acquire()
    )
      return false;
    setOperation(kind);
    return true;
  };
  const finish = () => {
    gate.current.release();
    if (mounted.current) setOperation(null);
  };
  const writeCollection = (items: AttachmentDto[]) => {
    setValue(name, items, { shouldDirty: true, shouldValidate: true });
  };

  const onInputFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (disableUpload || !collection.valid || !begin('upload')) return;
    try {
      const files = Array.from(event.currentTarget.files ?? []);
      setErrors([]);
      if (!files.length) return;
      const before = readAttachments(getValues(name));
      if (!before.valid) {
        reportError(
          'Invalid attachment data. Refresh the form before making changes.',
        );
        return;
      }
      const errors = validateSelection(
        files,
        allowedTypes,
        maxFiles,
        allowMultiple === true,
      );
      if (errors.length) {
        addErrors(errors);
        return;
      }
      const accepted = files.filter((file) => file.size <= maxSizeInBytes);
      addErrors(
        files
          .filter((file) => file.size > maxSizeInBytes)
          .map(
            (file) =>
              `Upload failed: ${file.name} exceeds the ${formatBytes(maxSizeInBytes)} limit.`,
          ),
      );
      if (!accepted.length) return;
      const snapshot = snapshotAttachments(before.items);
      const result = await onUploadFiles(accepted);
      if (!mounted.current) return;
      const uploaded = readAttachments(result);
      const current = readAttachments(getValues(name));
      if (
        result == null ||
        !uploaded.valid ||
        (!allowMultiple && uploaded.items.length > 1)
      ) {
        reportError(
          'Upload returned invalid attachment data. Refresh the form before retrying.',
        );
        return;
      }
      if (
        !current.valid ||
        current.scalar !== before.scalar ||
        !matchesSnapshot(snapshot, current.items)
      ) {
        reportError(
          'Attachments changed during upload. Refresh the form to reconcile the uploaded files.',
        );
        return;
      }
      // The supplied implementations replace the list with the callback result, not append.
      writeCollection(uploaded.items);
    } catch {
      // Arbitrary server errors may contain credentials or private document details.
      reportError('Upload failed. Please try again or contact support.');
    } finally {
      clearFileInput();
      finish();
    }
  };

  const onConfirmDeleteFile = async (attachment: AttachmentDto) => {
    if (!attachment.id || attachment.documentLocked || !begin('delete')) return;
    const documentId = attachment.id;
    try {
      setErrors([]);
      const before = readAttachments(getValues(name));
      const target = before.items.find((item) => item.id === documentId);
      if (!before.valid || !target || target.documentLocked) return;
      await onDeleteFile(
        documentId,
        remainingUnlockedCount(before.items, documentId),
      );
      if (!mounted.current) return;
      const current = readAttachments(getValues(name));
      if (!current.valid) {
        reportError(
          'File deleted but attachment data changed. Refresh the form to reconcile it.',
        );
        return;
      }
      const deletedTarget = current.items.find(
        (item) => item.id === documentId,
      );
      if (deletedTarget?.documentLocked) {
        reportError(
          'File deleted but its lock status changed. Refresh the form to reconcile it.',
        );
        return;
      }
      if (deletedTarget) {
        // Re-read after the await; never replace the list with a captured stale array.
        writeCollection(current.items.filter((item) => item.id !== documentId));
      }
      clearFileInput();
    } catch {
      reportError(
        'Could not delete the file. Please try again or contact support.',
      );
    } finally {
      finish();
    }
  };

  const changeCategory = async (
    attachment: AttachmentDto,
    index: number,
    category: string,
  ) => {
    if (
      attachment.documentLocked ||
      (category !== '' &&
        !CATEGORY_OPTIONS.some((option) => option.value === category)) ||
      !begin('category')
    )
      return;
    try {
      const before = readAttachments(getValues(name));
      if (!before.valid) return;
      const currentIndex = attachment.id
        ? before.items.findIndex((item) => item.id === attachment.id)
        : index;
      const target = before.items[currentIndex];
      if (!target || target.documentLocked) return;
      if (
        !attachment.id &&
        (!sameUnidentifiedAttachment(attachment, target) ||
          before.items.filter((item) =>
            sameUnidentifiedAttachment(attachment, item),
          ).length !== 1)
      ) {
        reportError(
          'Cannot identify this attachment reliably. Refresh the form before changing its category.',
        );
        return;
      }
      const previousCategory = target.attachmentCategory;
      const snapshot = snapshotAttachments([target]);
      if (onCategoryUpdate && target.id) {
        // Server-first and mutually exclusive: no optimistic rollback or out-of-order local saves.
        await onCategoryUpdate(target.id, category);
      }
      if (!mounted.current) return;
      const latest = readAttachments(getValues(name));
      const latestIndex = target.id
        ? latest.items.findIndex((item) => item.id === target.id)
        : currentIndex;
      const latestTarget = latest.items[latestIndex];
      if (
        !latest.valid ||
        !latestTarget ||
        latestTarget.documentLocked ||
        latestTarget.attachmentCategory !== previousCategory ||
        (!target.id && !matchesSnapshot(snapshot, [latestTarget]))
      ) {
        reportError(
          'Attachment changed while saving its category. Refresh the form to reconcile it.',
        );
        return;
      }
      setValue(categoryPath(name, latestIndex, latest.scalar), category, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    } catch {
      reportError(
        `Could not save the category for ${attachment.attachmentName ?? 'this file'}.`,
      );
    } finally {
      finish();
    }
  };

  const attachmentKey = (attachment: AttachmentDto) => {
    if (attachment.id) return `id-${attachment.id}`;
    const previous = unidentifiedKeys.current.get(attachment);
    if (previous !== undefined) return previous;
    keyCounter.current += 1;
    const key = `local-${keyCounter.current}`;
    unidentifiedKeys.current.set(attachment, key);
    return key;
  };

  const renderAttachments = () => (
    <>
      {isSubmitted && (
        <Row className='mx-1 mb-3 py-2 border-bottom border-muted d-none d-md-flex'>
          <Col sm={10} md={5} className='small'>
            Name
          </Col>
          <Col sm={5} md={3} className='small'>
            Category
          </Col>
          <Col sm={5} md={3} className='small'>
            Modified
          </Col>
          <Col sm={2} md={1} className='small'>
            <span className='visually-hidden'>Action</span>
          </Col>
        </Row>
      )}
      <ul className='list-unstyled mb-0'>
        {attachments.map((attachment, index) => {
          const key = attachmentKey(attachment);
          return (
            <li id={`attachment-${index + 1}`} key={key}>
              <RhfAttachmentItem
                attachment={attachment}
                name={name}
                index={index}
                categoryName={categoryPath(name, index, collection.scalar)}
                canRemove={
                  !isSummary && !attachment.documentLocked && !!attachment.id
                }
                cancelButtonId={`cancel-button-${attachment.id ?? key}`}
                onRemoveItem={onConfirmDeleteFile}
                onChangeCategory={changeCategory}
                onError={reportError}
                isSummary={isSummary === true || !!attachment.documentLocked}
                isSubmitted={isSubmitted}
                busy={busy || progressActive}
                {...omitUndefined({ onDownloadFile })}
              />
            </li>
          );
        })}
      </ul>
    </>
  );

  if (isSummary) {
    if (!collection.valid)
      return (
        <span role='alert'>Invalid attachment data. Refresh the form.</span>
      );
    return attachments.length ? (
      <div className='attachments-summary'>{renderAttachments()}</div>
    ) : (
      <span>No details added</span>
    );
  }

  return (
    <>
      <div
        className={`form-field-container position-relative ${containerClassName ?? ''}`}
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
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.preventDefault();
                }}
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
                disabled={
                  (disableUpload ?? busy) || progressActive || !collection.valid
                }
                ref={inputRef}
                id={`drag-upload-${controlId}`}
                data-testid={`drag-upload-${controlId}`}
                type='file'
                accept={allowedTypes}
                multiple={allowMultiple === true ? true : undefined}
                readOnly
                tabIndex={0}
                title={
                  disableUpload || busy || progressActive || !collection.valid
                    ? 'Drag files disabled'
                    : (buttonTitle ?? 'Drag files here')
                }
                // TO DO: Move the inline style into own class
                className='position-absolute top-0 start-0 w-100 h-100 opacity-0'
                style={{
                  cursor: 'grab',
                  zIndex: 2,
                }}
                aria-describedby={describedBy}
                aria-invalid={showFieldError || !collection.valid}
                onBlur={field.onBlur}
                onChange={(event) => {
                  void onInputFileChange(event);
                }}
              />
              <input
                disabled={
                  (disableUpload ?? busy) || progressActive || !collection.valid
                }
                type='button'
                id={controlId}
                name={name}
                data-testid={controlId}
                value={buttonTitle ?? 'Browse files'}
                // TO DO: Move the inline style into own class
                className='d-flex d-md-inline-block gap-2 position-relative btn btn-nmi-secondary flex-grow-1 mx-auto mb-2'
                style={{ zIndex: 3 }}
                aria-describedby={describedBy}
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
        {showFieldError && (
          <div
            id={`${controlId}-validation-msg`}
            role='alert'
            className='text-danger'
          >
            {fieldState.error?.message ?? 'Check the attachments.'}
          </div>
        )}
        {!collection.valid && (
          <p
            id={`${controlId}-attachment-state-error`}
            role='alert'
            className='text-danger'
          >
            Invalid attachment data. Refresh the form before making changes.
          </p>
        )}
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
      {progress && progressActive ? (
        <Col role='status' aria-live='polite'>
          <ProgressBar
            percent={progress.percent ?? 0}
            status={progress.status ?? ''}
          />
          <p className='mt-2 mb-4 ms-1 text-muted small'>
            {progress.completedFiles}
            {' / '}
            {progress.totalFiles}
            {' files processed'}
          </p>
          <ProgressFileList
            files={progress.files ?? []}
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
            {attachments.some((attachment) => !attachment.documentLocked) && (
              <p className='h6 mb-3'>
                Select a category to classify each document
              </p>
            )}
            <Col id='file-upload-attachments' className='attachments-upload'>
              {renderAttachments()}
            </Col>
          </Row>
        )
      )}
    </>
  );
};

export default RhfAttachment;
