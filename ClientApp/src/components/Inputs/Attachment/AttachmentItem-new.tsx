import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from 'react-bootstrap';
import { useField } from 'formik';
import type { AttachmentDto } from '../../../api/web-api-client';
import { formatBytes } from '../../../utils';
import ConfirmationModal from '../../modals/ConfirmationModal';
import SelectInput from '../SelectInput';
import type { SelectInputOption } from '../SelectInput/types';
import { getFileUrlFromBase64 } from '../../../routes/common/helperFunctions';

interface AttachmentItemProps {
    id?: string;
    name: string,
    index: number,
    canRemove: boolean;
    cancelButtonId: string;
    isSummary: boolean;
    onRemoveItem?: (attachment: AttachmentDto) => Promise<void>;
    onCategoryUpdate?: (docId: string, category: string) => Promise<void>;
    fileBytes?: any;
}

const AttachmentItemNew = ({
    canRemove, onRemoveItem, cancelButtonId, isSummary, name, index, fileBytes, onCategoryUpdate, id,
} : AttachmentItemProps) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [catField, catMeta, { setValue, setTouched }] = useField({ name: `${name}[${index}].attachmentCategory` });
    const [contentField] = useField<AttachmentDto>({ name: `${name}[${index}]` });
    const closeModal = () => setDeleteDialogOpen(false);
    const showModal = () => setDeleteDialogOpen(true);
    const fileUrl = fileBytes && getFileUrlFromBase64(fileBytes);

    /* TO DO - Add in Category select input */
    const getCategories = () => {
        const options: SelectInputOption<string>[] = [];
        options.push({ displayText: 'Test Report', value: 'Test Report' });
        options.push({ displayText: 'Certificate', value: 'Certificate' });
        options.push({ displayText: 'Specifications', value: 'Specifications' });
        options.push({ displayText: 'Manuals', value: 'Manuals' });
        options.push({ displayText: 'Photos or diagrams', value: 'Photos or diagrams' });
        options.push({ displayText: 'Other', value: 'Other' });
        return options;
    };

    const onCategoryChange = (event: ChangeEvent<HTMLInputElement>) => {
        // A form control's `value` is always a string, never null, so the guard that stood here
        // could not fail. An unset category arrives as an empty string and is handled below.
        setValue(event.target.value);
        setTouched(true);
        if (onCategoryUpdate && id) {
            onCategoryUpdate(id, event.target.value);
        }
    };

    return (
        <div className={`attachment mb-2 ${isSummary ? 'p-1' : 'p-4'}`}>
            <div className='d-flex align-items-center'>
                {/* Icon and filename (flex: 1 for most space) */}
                <div className='d-flex flex-fill align-items-center'>
                    <i className='icon-file fs-2 me-2' aria-hidden='true' />
                    <div>
                        <a
                            href={fileUrl}
                            download={contentField.value.attachmentName}
                            className='attachment-name pt-0 text-left text-break'
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            {contentField.value.attachmentName}
                        </a>
                        <br />
                        <span className='attachment-size fs-8 fw-normal text-left'>
                            {(contentField.value.attachmentSize) ? formatBytes(+(contentField.value.attachmentSize)) : null}
                        </span>
                    </div>
                </div>
                {/* Dropdown (fixed width, margin for spacing) */}
                <div className='ms-3' style={{ width: '260px' }}>
                    <SelectInput<string>
                        id={catField.name}
                        key={catField.name}
                        name={catField.name}
                        label='Category'
                        defaultDisplayText='Select'
                        options={getCategories()}
                        onChange={onCategoryChange}
                        isSummary={isSummary}
                        containerClassName='me-4 pe-2'
                        className={`form-select-sm${!catField.value && catMeta.touched ? ' is-invalid' : ''}`}
                        addBlank
                    />
                </div>
                {/* Remove button (auto width, margin for spacing) */}
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
                            <span className='visually-hidden'>{`Delete ${contentField.value.attachmentName}`}</span>
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
                        onModalYes={() => onRemoveItem && onRemoveItem(contentField.value)}
                        noButtonTitle='Cancel'
                        yesButtonTitle='Yes, delete'
                    />
                )}
            </div>
            {/* Reserve space for error message so layout doesn't shift */}
            <div style={{ minHeight: 20 }}>
                {!catField.value && catMeta.touched && (
                    <div className='text-danger text-body'>
                        Select a category that best describes this document.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttachmentItemNew;
