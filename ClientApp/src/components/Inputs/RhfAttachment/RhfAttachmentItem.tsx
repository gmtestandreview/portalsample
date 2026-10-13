import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useController, useFormContext } from 'react-hook-form';
import type { AttachmentDto } from '../../../api/web-api-client';
import { formatBytes } from '../../../utils';
import ConfirmationModal from '../../modals/ConfirmationModal';
import RhfSelectInput from '../RhfSelectInput';
import type { SelectInputOption } from '../SelectInput/types';
import { getFileUrlFromBase64 } from '../../../routes/common/helperFunctions';

interface RhfAttachmentItemProps {
  attachment: AttachmentDto;
  /** Field name of the whole attachment list, e.g. `form.documents`. */
  name: string;
  index: number;
  canRemove: boolean;
  cancelButtonId: string;
  isSummary: boolean;
  onRemoveItem?: (attachment: AttachmentDto) => Promise<void>;
  onCategoryUpdate?: (docId: string, category: string) => Promise<void>;
  /** Called with a user-facing message when saving a category fails. */
  onCategoryError?: (message: string) => void;
}

const CATEGORY_OPTIONS: SelectInputOption<string>[] = [
  { displayText: 'Test Report', value: 'Test Report' },
  { displayText: 'Certificate', value: 'Certificate' },
  { displayText: 'Specifications', value: 'Specifications' },
  { displayText: 'Manuals', value: 'Manuals' },
  { displayText: 'Photos or diagrams', value: 'Photos or diagrams' },
  { displayText: 'Other', value: 'Other' },
];

const RhfAttachmentItem = ({
  attachment,
  canRemove,
  onRemoveItem,
  cancelButtonId,
  isSummary,
  name,
  index,
  onCategoryUpdate,
  onCategoryError,
}: Readonly<RhfAttachmentItemProps>) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const categoryName = `${name}.${index}.attachmentCategory`;
  const { field, formState } = useController({
    name: categoryName,
  });
  // RHF keys touched state by field path, so it would stay with the row index
  // when an earlier row is deleted. Local state stays with this row's key.
  const [categoryTouched, setCategoryTouched] = useState<boolean>(false);
  const { getValues, setValue } = useFormContext();
  const initialCategory: unknown = field.value;
  // What the server holds, and which save is newest, so a failed save only
  // undoes itself and only while it is still the latest one.
  const lastSavedCategory = useRef<string | undefined>(
    typeof initialCategory === 'string' ? initialCategory : undefined
  );
  const latestSaveToken = useRef(0);
  const lastSavedToken = useRef(0);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  const closeModal = () => setDeleteDialogOpen(false);
  const showModal = () => setDeleteDialogOpen(true);
  const { documentBytes } = attachment;
  // One object URL per document, not per render, released when it changes or the row goes.
  const fileUrl = useMemo(
    () => (documentBytes ? getFileUrlFromBase64(documentBytes) : undefined),
    [documentBytes]
  );
  useEffect(
    () => () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    },
    [fileUrl]
  );
  // A submit attempt does not touch fields in RHF, so it counts as touched here.
  const showCategoryError =
    !field.value && (categoryTouched || formState.isSubmitted);

  // The index can change while a save is in flight (an earlier row deleted),
  // so find this document again instead of trusting the captured path.
  const revertCategory = (token: number) => {
    if (!isMounted.current || token !== latestSaveToken.current) return;
    const list: unknown = getValues(name);
    if (!Array.isArray(list)) return;
    const currentIndex = (list as AttachmentDto[]).findIndex(
      (item) => item.id === attachment.id
    );
    if (currentIndex < 0) return;
    setValue(
      `${name}.${currentIndex}.attachmentCategory`,
      lastSavedCategory.current,
      { shouldDirty: true }
    );
  };

  const saveCategory = async (
    update: NonNullable<typeof onCategoryUpdate>,
    docId: string,
    category: string
  ) => {
    latestSaveToken.current += 1;
    const token = latestSaveToken.current;
    try {
      await update(docId, category);
      if (token > lastSavedToken.current) {
        lastSavedToken.current = token;
        lastSavedCategory.current = category;
      }
    } catch {
      // The error is left out of the message: it can carry tokens or PII.
      revertCategory(token);
      onCategoryError?.(
        `Could not save the category for ${attachment.attachmentName}.`
      );
    }
  };

  const onCategoryChange = (category: string) => {
    if (onCategoryUpdate && attachment.id) {
      void saveCategory(onCategoryUpdate, attachment.id, category);
    }
  };

  return (
    <div className={`attachment mb-2 ${isSummary ? 'p-1' : 'p-4'}`}>
      <div className='d-flex align-items-center'>
        <div className='d-flex flex-fill align-items-center'>
          <i className='icon-file fs-2 me-2' aria-hidden='true' />
          <div>
            <a
              href={fileUrl}
              download={attachment.attachmentName}
              className='attachment-name pt-0 text-left text-break'
              target='_blank'
              rel='noopener noreferrer'
            >
              {attachment.attachmentName}
            </a>
            <br />
            <span className='attachment-size fs-8 fw-normal text-left'>
              {attachment.attachmentSize
                ? formatBytes(+attachment.attachmentSize)
                : null}
            </span>
          </div>
        </div>
        {/* Blur bubbles from the select, so tabbing past it also counts as touched. */}
        <div
          className='ms-3'
          style={{ width: '260px' }}
          onBlur={() => setCategoryTouched(true)}
        >
          <RhfSelectInput<string>
            id={categoryName}
            key={categoryName}
            name={categoryName}
            label='Category'
            defaultDisplayText='Select'
            options={CATEGORY_OPTIONS}
            onChange={onCategoryChange}
            isSummary={isSummary}
            containerClassName='me-4 pe-2'
            className={`form-select-sm${showCategoryError ? ' is-invalid' : ''}`}
            addBlank
          />
        </div>
        {canRemove && (
          <div className='d-flex align-items-center ms-3'>
            <Button
              variant='btn btn-flat'
              data-testid={cancelButtonId}
              id={cancelButtonId}
              name={cancelButtonId}
              title='Delete'
              aria-label={`Delete ${attachment.attachmentName}`}
              className='p-0 fs-7 d-flex align-self-center'
              onClick={showModal}
            >
              <i className='icon-close' aria-hidden='true' />
              <span className='visually-hidden'>{`Delete ${attachment.attachmentName}`}</span>
            </Button>
          </div>
        )}
        {canRemove && (
          <ConfirmationModal
            closeModal={closeModal}
            isOpen={deleteDialogOpen}
            titleText='Confirm deletion'
            bodyText='Are you sure you want to remove this file?'
            onModalNo={closeModal}
            onModalYes={() => onRemoveItem?.(attachment)}
            noButtonTitle='Cancel'
            yesButtonTitle='Yes, delete'
          />
        )}
      </div>
      {/* Reserve space for error message so layout doesn't shift */}
      <div style={{ minHeight: 20 }}>
        {showCategoryError && (
          <div className='text-danger text-body'>
            Select a category that best describes this document.
          </div>
        )}
      </div>
    </div>
  );
};

export default RhfAttachmentItem;
