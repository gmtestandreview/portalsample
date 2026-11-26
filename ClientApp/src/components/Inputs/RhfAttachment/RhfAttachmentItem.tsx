import { useEffect, useRef, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { useController } from 'react-hook-form';
import type { AttachmentDto } from '../../../api/web-api-client';
import { formatBytes, formatDateToString } from '../../../utils';
import ConfirmationModal from '../../modals/ConfirmationModal';
import { getFileUrlFromBase64 } from '../../../routes/common/helperFunctions';
import { CATEGORY_OPTIONS } from './attachmentContracts';

interface RhfAttachmentItemProps {
  attachment: AttachmentDto;
  name: string;
  index: number;
  categoryName?: string;
  canRemove: boolean;
  cancelButtonId: string;
  isSummary: boolean;
  isSubmitted?: boolean;
  busy?: boolean;
  onRemoveItem?: (attachment: AttachmentDto) => Promise<void>;
  onChangeCategory: (
    attachment: AttachmentDto,
    index: number,
    category: string,
  ) => Promise<void>;
  onDownloadFile?: (fileName: string) => Promise<void>;
  onError: (message: string) => void;
}

type LocalUrl = { bytes: AttachmentDto['documentBytes']; url: string };

const RhfAttachmentItem = ({
  attachment,
  name,
  index,
  categoryName = `${name}.${index}.attachmentCategory`,
  canRemove,
  cancelButtonId,
  isSummary,
  isSubmitted = false,
  busy = false,
  onRemoveItem,
  onChangeCategory,
  onDownloadFile,
  onError,
}: Readonly<RhfAttachmentItemProps>) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [downloadPending, setDownloadPending] = useState(false);
  const downloadGate = useRef(false);
  const mounted = useRef(true);
  const { field, formState } = useController({ name: categoryName });
  const [localUrl, setLocalUrl] = useState<LocalUrl | undefined>(undefined);
  const { documentBytes, attachmentName } = attachment;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  // Resource ownership belongs to the effect, never to render/useMemo.
  useEffect(() => {
    if (isSubmitted || !documentBytes) {
      setLocalUrl(undefined);
      return;
    }
    let url: string | undefined;
    try {
      const created = getFileUrlFromBase64(documentBytes);
      if (typeof created === 'string' && created.startsWith('blob:'))
        url = created;
    } catch {
      // Fail closed; do not expose conversion exceptions or unsafe URLs.
    }
    setLocalUrl(url ? { bytes: documentBytes, url } : undefined);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [documentBytes, isSubmitted]);

  const fileUrl =
    !isSubmitted && localUrl && localUrl.bytes === documentBytes
      ? localUrl.url
      : undefined;
  const category = typeof field.value === 'string' ? field.value : '';
  const showCategoryError =
    !isSummary && !category && (categoryTouched || formState.isSubmitted);
  const isOriginNMI = attachment.attachmentOrigin === 'Pattern Approval';
  const isPublished = attachment.attachmentPublishedStatus === 'Published';
  const errorId = `${categoryName}-validation-msg`;
  const canDownload = !!onDownloadFile && !!attachmentName;

  const downloadSubmitted = async () => {
    if (!onDownloadFile || !attachmentName || downloadGate.current) return;
    downloadGate.current = true;
    setDownloadPending(true);
    try {
      await onDownloadFile(attachmentName);
    } catch {
      if (mounted.current)
        onError(`Could not download ${attachmentName}. Please try again.`);
    } finally {
      downloadGate.current = false;
      if (mounted.current) setDownloadPending(false);
    }
  };

  const closeModal = () => setDeleteDialogOpen(false);
  const selectCategory = (value: string) => {
    if (busy || isSummary) return;
    setCategoryTouched(true);
    void onChangeCategory(attachment, index, value);
  };

  return (
    <div className='attachment mb-2'>
      <Row className='row-cols-2 row-cols-sm-2 row-cols-md-4 -align-items-center align-items-top'>
        <Col
          xs={{ span: 10, order: 1 }}
          sm={{ span: 11, order: 1 }}
          md={{ span: 5, order: 1 }}
          className='d-flex -flex-fill -align-items-center pt-1'
        >
          <i className='icon-file fs-2 me-2' aria-hidden='true' />
          <div className='attachment-description -d-flex -flex-column mb-2 ms-1 me-2 -w-100'>
            {isSubmitted && canDownload ? (
              <button
                type='button'
                className='btn btn-link p-0 attachment-name pt-0 text-left text-break'
                disabled={downloadPending}
                onClick={() => {
                  void downloadSubmitted();
                }}
              >
                {attachmentName}
              </button>
            ) : !isSubmitted && fileUrl ? (
              <a
                href={fileUrl}
                download={attachmentName}
                className='attachment-name pt-0 text-left text-break'
                target='_blank'
                rel='noopener noreferrer'
              >
                {attachmentName}
              </a>
            ) : (
              <span className='attachment-name pt-0 text-left text-break'>
                {attachmentName}
                <span className='visually-hidden'> (Download unavailable)</span>
              </span>
            )}
            {isPublished && isOriginNMI && (
              <span
                className='badge badge-sm rounded-pill bg-danger ms-2 small'
                title='Published by NMI'
              >
                NMI
              </span>
            )}
            <br />
            <span className='attachment-size mt-1 fs-8 fw-normal text-left'>
              {attachment.attachmentSize
                ? formatBytes(+attachment.attachmentSize)
                : null}
            </span>
          </div>
        </Col>
        <Col
          xs={{ span: 10, offset: 1, order: 3 }}
          sm={{ offset: 1, order: 3 }}
          md={{ offset: 0, order: 2 }}
          className='attachment-cat fw-normal small lh-sm'
        >
          <div style={{ minWidth: '205px' }} className='me-4 pe-2 small'>
            {isSummary ? (
              <div>
                <span className='visually-hidden'>Category: </span>
                {CATEGORY_OPTIONS.find((option) => option.value === category)
                  ?.displayText ?? category}
              </div>
            ) : (
              <>
                <label htmlFor={categoryName} className='visually-hidden'>
                  Category
                </label>
                <select
                  id={categoryName}
                  name={field.name}
                  ref={field.ref}
                  value={category}
                  disabled={busy}
                  className={`form-select form-select-sm${showCategoryError ? ' is-invalid' : ''}`}
                  aria-invalid={showCategoryError}
                  aria-describedby={showCategoryError ? errorId : undefined}
                  onBlur={() => {
                    field.onBlur();
                    setCategoryTouched(true);
                  }}
                  onChange={(event) =>
                    selectCategory(event.currentTarget.value)
                  }
                >
                  <option value=''>Select</option>
                  {category &&
                    !CATEGORY_OPTIONS.some(
                      (option) => option.value === category,
                    ) && (
                      <option value={category} disabled>
                        {category}
                      </option>
                    )}
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.displayText}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </Col>
        <Col
          xs={{ span: 10, offset: 1, order: 4 }}
          sm={{ offset: 1, order: 4 }}
          md={{ offset: 0, order: 3 }}
          className='attachment-mod fw-normal small lh-sm'
        >
          {isSubmitted && !canRemove && (
            <div className='mt-1'>
              {isOriginNMI
                ? attachment.attachmentAuthor
                : attachment.attachmentPortalUsername}
              <br />
              {formatDateToString(attachment.attachmentModifiedDate)}
            </div>
          )}
        </Col>
        {canRemove && (
          <Col
            xs={{ span: 1, order: 2 }}
            sm={{ span: 1, order: 2 }}
            md={{ span: 1, order: 4 }}
            className='-d-none -d-md-flex d-flex -align-items-center justify-content-end'
          >
            <Button
              variant='btn btn-flat'
              data-testid={cancelButtonId}
              id={cancelButtonId}
              name={cancelButtonId}
              title='Delete'
              aria-label={`Delete ${attachmentName ?? ''}`}
              disabled={busy}
              className='d-flex align-self-top mt-2 p-0 fs-7'
              onClick={() => setDeleteDialogOpen(true)}
            >
              <i className='icon-close' aria-hidden='true' />
              <span className='visually-hidden'>{`Delete ${attachmentName ?? ''}`}</span>
            </Button>
          </Col>
        )}
        {canRemove && (
          <ConfirmationModal
            closeModal={closeModal}
            isOpen={deleteDialogOpen}
            titleText='Confirm deletion'
            bodyText='Are you sure you want to remove this file?'
            onModalNo={closeModal}
            onModalYes={() => {
              if (busy) return;
              closeModal();
              void onRemoveItem?.(attachment);
            }}
            noButtonTitle='Cancel'
            yesButtonTitle='Yes, delete'
          />
        )}
      </Row>
      {!isSummary && (
        <div style={{ minHeight: 20 }}>
          {showCategoryError && (
            <div id={errorId} className='text-danger text-body' role='alert'>
              Select a category that best describes this document.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RhfAttachmentItem;
