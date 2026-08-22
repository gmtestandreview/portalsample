import type React from 'react';
import { useState } from 'react';
import type { FileProgress } from '../../api/web-api-client';
import { FileStatus } from '../../routes/ta/types';

interface FileListProps {
    files: FileProgress[];
    onCancelFile?: (fileName: string) => void;
}

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const ProgressFileList: React.FC<FileListProps> = ({ files, onCancelFile }) => {
    const [cancelling, setCancelling] = useState<{ [fileName: string]: boolean }>({});

    const handleCancel = (fileName: string) => {
        setCancelling((prev) => ({ ...prev, [fileName]: true }));
        if (onCancelFile) onCancelFile(fileName);
    };

    return (
        <ul className='unstyled-list mt-2 p-0'>
            {files.map((f) => {
                const hasProgress = f.bytesUploaded !== undefined && f.totalBytes !== undefined;
                const progressPercent = hasProgress ? Math.round((f.bytesUploaded! / f.totalBytes!) * 100) : 0;
                const isCancellable = f.status === FileStatus.Uploading || f.status === FileStatus.Pending;

                return (
                    <li
                        key={f.fileName}
                        className='attachment d-flex flex-column mb-4 p-4 bg-white shadow text-body small'
                    >
                        <div className='d-flex align-items-top'>
                            <i className='icon-file fs-2 me-2' aria-hidden='true' />
                            <span className='visually-hidden'>Uploading attachment</span>
                            <div className='attachment-description d-flex flex-column mb-2 ms-1 me-2 w-100'>
                                <span className='attachment-name pt-0 text-left text-break'>
                                    {f.fileName}
                                </span>
                                <span className='attachment-size mt-1 fs-8 fw-normal text-left'>
                                    {hasProgress ? formatBytes(f.totalBytes!) : ''}
                                </span>
                            </div>
                            <div className='d-flex align-items-top ms-3'>
                                {isCancellable && onCancelFile && (
                                    cancelling[f.fileName!] ? (
                                        <span className='text-danger ms-2'>Cancelling...</span>
                                    ) : (
                                        <button
                                            type='button'
                                            data-testid={`cancel-button-${f.fileName}`}
                                            id={`cancel-button-${f.fileName}`}
                                            name={`cancel-button-${f.fileName}`}
                                            title='Cancel uploading'
                                            aria-label={`Cancel uploading ${f.fileName}`}
                                            className='d-flex align-self-top mt-1 p-0 btn btn-flat fs-7'
                                            onClick={() => handleCancel(f.fileName!)}
                                        >
                                            <i className='icon-close' aria-hidden='true' />
                                            <span className='visually-hidden'>
                                                {'Cancel uploading '}
                                                {f.fileName}
                                            </span>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                        {/* Progress bar below the row */}
                        {hasProgress && (
                            <div role='progressbar' className='mt-1'>
                                <div
                                    className='d-flex justify-content-between ms-1 mb-1'
                                >
                                    <span className='fs-8 text-muted'>
                                        {formatBytes(f.bytesUploaded!)}
                                        {' / '}
                                        {formatBytes(f.totalBytes!)}
                                    </span>
                                    <span className='fs-8 text-muted'>
                                        {` ${progressPercent}%`}
                                    </span>
                                </div>
                                <div
                                    className='progress w-100 bg-light rounded overflow-hidden'
                                    style={{
                                        height: 6,
                                    }}
                                >
                                    <div
                                        className='h-100 bg-primary rounded-pill'
                                        style={{
                                            width: `${progressPercent}%`,
                                            transition: 'width 0.3s ease',
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

export default ProgressFileList;
