 
 
 
import { useField } from 'formik';
import type { FieldHookConfig } from 'formik';
import { isArray, map } from 'lodash';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
    Col, Form, Row,
} from 'react-bootstrap';
import type { AttachmentDto, ProblemDetails } from '../../../api/web-api-client';
import { formatBytes } from '../../../utils';
import BlockUISpinner from '../../BlockUISpinner';
import type { AttachmentProps } from './types';
import AttachmentItemNew from './AttachmentItem-new';
import ProgressBar from '../../Progress/ProgressBar';
import ProgressFileList from '../../Progress/ProgressFileList';

const AttachmentNew = (
    props: AttachmentProps & FieldHookConfig<AttachmentDto[]>,
) => {
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

    const [
        _field,
        meta,
        { setValue },
    ] = useField<AttachmentDto[] | AttachmentDto | null>(name);

    const { value } = meta;
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
     
    const inputRef = useRef<any>(null);
    // console.log('SD: ', value);
    const maxSizeInKb = maxSizeInMB * 1024 * 1024;

    const onInputFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.value === null) {
            return;
        }

        setErrors([]);
        let hasError = false;
        setIsUploading(true);
        if (event.currentTarget.files !== null) {
            const currentFileCount = event.currentTarget.files.length;
            const hasMultipleFiles = currentFileCount > 1;
            const fileUploadAllowedTypes = allowedTypes.split(',').map((type) => type.trim());
            const hasMultipleAllowedTypes = fileUploadAllowedTypes.length > 1;

            for (let i = 0; i < currentFileCount; i++) {
                const file = event.currentTarget.files[i];
                const fileHasExtension = file.name.includes('.');
                const currentFileExtension = `.${file.name.split('.').pop()!.toString()}`;

                if (!fileHasExtension || !fileUploadAllowedTypes.includes(currentFileExtension)) {
                    const errorMessage = `${hasMultipleFiles ? 'Files' : 'File'} must be`
            + ` ${hasMultipleAllowedTypes ? 'one of the following types' : 'of the following type'}:`
            + ` ${fileUploadAllowedTypes.join(', ')}`;
                    setErrors((newErrors) => [...newErrors, errorMessage]);
                    hasError = true;
                }
            }

            if (currentFileCount > maxFiles) {
                 
                setErrors((newErrors) => [...newErrors, `The files selected have not been uploaded as you have selected more files than the maximum number allowed - (${maxFiles}).`]);
                hasError = true;
            }

            if (!hasError) {
                try {
                    // The field always holds a list, even when only one file is allowed. Storing a
                    // lone object in that case broke AttachmentItemNew, which addresses its field
                    // as `name[index]` and so read undefined.
                    let attachments: AttachmentDto[] = isArray(value) ? value : [];
                    let newAttachments: AttachmentDto[] = [];
                    if (currentFileCount === 1) {
                        const file = event.currentTarget.files[0];
                        if (file.size > maxSizeInKb) {
                            setErrors(
                                (newErrors) => [
                                    ...newErrors,
                                    `Upload failed: ${file.name} exceeds the ${formatBytes(maxSizeInKb)} limit.`,
                                ],
                            );
                            hasError = true;
                        } else {
                            const result = await onUploadFiles([file]);
                            newAttachments = [...result as AttachmentDto[]];
                            attachments = [...newAttachments];
                            setValue(attachments);
                            if (inputRef.current && inputRef.current.value !== null) {
                                inputRef.current.value = null;
                                inputRef.current.files = null;
                            }
                        }
                    } else {
                        const files:File[] = [];
                        for (let i = 0; i < currentFileCount; i++) {
                            const file = event.currentTarget.files[i];
                            if (file.size > maxSizeInKb) {
                                setErrors(
                                    (newErrors) => [
                                        ...newErrors,
                                        `Upload failed: ${file.name} exceeds the ${formatBytes(maxSizeInKb)} limit.`,
                                    ],
                                );
                                hasError = true;
                            } else {
                                files.push(file);
                            }
                        }

                        const result = await onUploadFiles(files);
                        newAttachments = [...result as AttachmentDto[]];
                        attachments = [...newAttachments];

                        setValue(attachments);
                    }
                } catch (errorMessage) {
                    const serverErrors = map(
                        (errorMessage as ProblemDetails).errors,
                        (error) => error,
                    );
                    setErrors((newErrors) => [...newErrors, ...serverErrors]);
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
                setValue((isArray(value) ? value : []).filter(
                    (item: AttachmentDto) => item.id !== attachment.id,
                ));
                if (inputRef.current && inputRef.current.value !== null) {
                    inputRef.current.value = null;
                    inputRef.current.files = null;
                }
            }
        } catch (errorMessage) {
            setErrors((newErrors) => [...newErrors, `${errorMessage}`]);
        }
        setIsDeleting(false);
    };

    const renderAttachments = () => {
        const attachments: AttachmentDto[] = isArray(value) ? value : [];
        return attachments?.map((attachment, i) => (
            <AttachmentItemNew
                id={attachment.id}
                name={name}
                index={i}
                canRemove={!isSummary && !attachment.documentLocked!}
                cancelButtonId={`cancel-button-${attachment.id}`}
                onRemoveItem={onConfirmDeleteFile}
                key={attachment.id}
                fileBytes={attachment.documentBytes}
                isSummary={isSummary || attachment.documentLocked!}
                onCategoryUpdate={onCategoryUpdate}
            />
        ));
    };
    // ...existing code...

    if (isSummary) {
        return (
            <>
                {
                    isArray(value) && value.length > 0
                        ? <div className='attachments-summary'>{ renderAttachments() }</div>
                        : (<span>No details added</span>)
                }
            </>
        );
    }

    return (
        <>
            <div
                className={`form-field-container position-relative ${containerClassName || ''}`}
            >
                {/*   {isUploading && (
                    <BlockUISpinner>
                        <p>Uploading...</p>
                    </BlockUISpinner>
                )} */}
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
                                htmlFor={`drag-upload-${id ?? name}`}
                                className='mb-0 text-center'
                                onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => e.preventDefault()}
                                aria-label={ariaLabel}
                            >
                                {label}
                            </Form.Label>
                            <div id={`help-${id ?? name}`} className='contextual-help form-text text-center'>
                                {inlineHelp}
                            </div>
                            {/* {
                    isArray(value) && value.length > 0 && (
                        renderAttachments()
                    )
                } */}
                            {/* {
                    isArray(value) && value.length < maxFiles && (
                        <> */}
                            <input
                                disabled={disableUpload}
                                ref={inputRef}
                                id={`drag-upload-${id ?? name}`}
                                data-testid={`drag-upload-${id ?? name}`}
                                type='file'
                                accept={allowedTypes}
                                multiple={allowMultiple === true ? true : undefined}
                                readOnly
                                tabIndex={0}
                                title={disableUpload ? 'Drag files disabled' : (buttonTitle || 'Drag files here')}
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
                                id={id ?? name}
                                name={name}
                                data-testid={id ?? name}
                                value={buttonTitle || 'Browse files'}
                                // TO DO: Move the inline style into own class
                                className='d-flex d-md-inline-block gap-2 position-relative btn btn-nmi-secondary flex-grow-1 mx-auto mb-2'
                                style={{ zIndex: 3 }}
                                aria-describedby={
                                    meta.touched && meta.error
                                        ? `${id ?? name}-validation-msg`
                                        : `help-${id ?? name}`
                                }
                                onClick={() => { inputRef.current.click(); }}
                            />
                            {/* </>
                    )
                } */}
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
                <div className='d-flex justify-content-center align-items-center my-3' role='status' aria-live='polite'>
                    <span className='spinner-border spinner-border-sm text-primary' />
                    <span className='ms-2'>Loading...</span>
                </div>
            )}
            {progress && (progress.status !== 'Completed' && progress.status !== 'CompletedWithErrors') ? (
                <Col role='status' aria-live='polite'>
                    <ProgressBar percent={progress.percent!} status={progress.status!} />
                    <p className='mt-2 mb-4 ms-1 text-muted small'>
                        {progress.completedFiles}
                        {' / '}
                        {progress.totalFiles}
                        {' files processed'}
                    </p>
                    <ProgressFileList files={progress.files!} onCancelFile={handleCancelFile} />
                </Col>
            ) : (
                isArray(value) && value.length > 0 && (
                    <Row className='mb-4'>
                        <h3 className='h4 mb-1'>
                            {/* Guarded by isArray(value) directly above. */}
                            {value.length}
                            {' files uploaded'}
                        </h3>
                        <p className='h6 mb-3'>
                            Select a category to classify each document
                        </p>
                        <Col id='file-upload-attachments'>
                            {renderAttachments()}
                        </Col>
                    </Row>
                )
            )}
        </>
    );
};
export default AttachmentNew;
