import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useController } from 'react-hook-form';
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
}: Readonly<RhfAttachmentItemProps>) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const categoryName = `${name}.${index}.attachmentCategory`;
  const { field, fieldState } = useController({ name: categoryName });
  const closeModal = () => setDeleteDialogOpen(false);
  const showModal = () => setDeleteDialogOpen(true);
  const fileUrl = attachment.documentBytes
    ? getFileUrlFromBase64(attachment.documentBytes)
    : undefined;
  const showCategoryError = !field.value && fieldState.isTouched;

  const onCategoryChange = (category: string) => {
    field.onBlur();
    if (onCategoryUpdate && attachment.id) {
      void onCategoryUpdate(attachment.id, category);
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
        <div className='ms-3' style={{ width: '260px' }}>
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
              aria-label='Delete'
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
