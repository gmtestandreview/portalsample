import type { Dispatch, SetStateAction } from 'react';
import type { AttachmentDto, FileProgress } from '../../../api/web-api-client';

export interface UploadProgress {
    status?: string;
    percent?: number;
    completedFiles?: number;
    totalFiles?: number;
    files?: FileProgress[];
}

export interface AttachmentProps {
    id?: string;
    name: string;
    label?: string;
    ariaLabel?: string;
    buttonTitle?: string;
    allowMultiple?: boolean;
    maxFiles: number;
    allowedTypes: string;
    maxSizeInMB: number;
    inlineHelp?: string;
    isSummary?: boolean;
    containerClassName?: string;
    className?: string;
    disableUpload?: boolean;
    progress?: UploadProgress;
    setErrors: Dispatch<SetStateAction<string[]>>;
    onUploadFiles: (files: File[]) => Promise<AttachmentDto | AttachmentDto[]>;
    onDeleteFile: (docId: string) => Promise<void>;
    handleCancelFile?: (fileName: string) => Promise<void>;
    onCategoryUpdate?: (docId: string, category: string) => Promise<void>;
}
