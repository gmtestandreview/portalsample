import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import {
  type AttachmentDto,
  type FileParameter,
  ProgressClient,
  RequestForPatternApprovalClient,
  type UploadProgress,
} from '../../api/web-api-client';
import { silentRequestFor } from '../../authentication/silentRequest';
import { pollUploadProgress } from './pollUploadProgress';

interface UploadState {
  uploading: boolean;
  setUploading: Dispatch<SetStateAction<boolean>>;
  progress: UploadProgress | undefined;
  setProgress: Dispatch<SetStateAction<UploadProgress | undefined>>;
  abortRef: MutableRefObject<AbortController | null>;
  uploadIdRef: MutableRefObject<string | null>;
}

interface UploadHandlersOptions {
  accounts: AccountInfo[];
  instance: IPublicClientApplication;
  id: string | undefined;
  fallbackUploadId?: string | null;
  onUploadError: (error: unknown) => void;
  mapUploadedDocument?: (
    attachment: AttachmentDto,
    document: AttachmentDto,
  ) => AttachmentDto;
  onAttachmentsUploaded?: (attachments: AttachmentDto[]) => void;
}

export interface UploadHandlers {
  uploading: boolean;
  progress: UploadProgress | undefined;
  setProgress: Dispatch<SetStateAction<UploadProgress | undefined>>;
  handleCancelFile: (fileName: string) => Promise<void>;
  onUploadAttachments: (
    token: string,
    fileData: FileParameter[],
  ) => Promise<AttachmentDto[]>;
}

export interface UploadErrorDetails {
  status: number | undefined;
  message: string;
}

export function getUploadErrorDetails(error: unknown): UploadErrorDetails {
  const status =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
      ? error.status
      : undefined;

  let message = 'Failed to commit documents.';
  if (status === 403) {
    message =
      'Upload blocked for security reasons. Please rename the file and try again. If the issue continues, contact support.';
  } else if (status && status >= 500) {
    message = 'A server error occurred. Please try again.';
  }

  return { status, message };
}

export function useUploadState(): UploadState {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | undefined>(
    undefined,
  );
  const abortRef = useRef<AbortController | null>(null);
  const uploadIdRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  return {
    uploading,
    setUploading,
    progress,
    setProgress,
    abortRef,
    uploadIdRef,
  };
}

export function useUploadHandlers({
  accounts,
  instance,
  id,
  fallbackUploadId = null,
  onUploadError,
  mapUploadedDocument,
  onAttachmentsUploaded,
}: UploadHandlersOptions): UploadHandlers {
  const uploadState = useUploadState();
  const { setUploading, setProgress, abortRef, uploadIdRef } = uploadState;

  const startLongPolling = useCallback(
    async (uploadId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      const client = new ProgressClient();
      const tokenResult = await instance.acquireTokenSilent(
        silentRequestFor(accounts[0]),
      );
      client.setAuthToken(tokenResult.accessToken);
      await pollUploadProgress({
        client,
        uploadId,
        signal: controller.signal,
        onProgress: setProgress,
        onFinished: () => {
          setUploading(false);
        },
      });
    },
    [abortRef, accounts, instance, setProgress, setUploading],
  );

  const handleCancelFile = useCallback(
    async (fileName: string) => {
      if (!uploadIdRef.current) return;
      try {
        const client = new ProgressClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0]),
        );
        client.setAuthToken(tokenResult.accessToken);
        await client.cancelFile(uploadIdRef.current, fileName);
      } catch {
        // Cancellation is best-effort; progress polling will reflect the final state
      }
    },
    [accounts, instance, uploadIdRef],
  );

  const onUploadAttachments = useCallback(
    async (
      token: string,
      fileData: FileParameter[],
    ): Promise<AttachmentDto[]> => {
      let attachments: AttachmentDto[] = [];
      try {
        const clientProgress = new ProgressClient();
        clientProgress.setAuthToken(token);
        const uploadId = await clientProgress.getProgressUploadId();
        uploadIdRef.current = uploadId;
        if (uploadIdRef.current) {
          void startLongPolling(uploadIdRef.current);
        }
        const clientPA = new RequestForPatternApprovalClient();
        clientPA.setAuthToken(token);
        const result = await clientPA.addDocuments(
          id,
          null,
          uploadId,
          fileData,
          null,
          null,
        );
        const { documents } = result.form ?? {};
        uploadIdRef.current = result.uploadId ?? fallbackUploadId;

        attachments =
          documents?.map((document) => {
            const attachment = {
              id: document.id,
              documentReference: document.id,
              attachmentType: document.attachmentType,
              attachmentMimeType: document.attachmentMimeType,
              attachmentSize: document.attachmentSize,
              attachmentName: document.attachmentName,
              attachmentUrl: document.attachmentUrl,
              attachmentCategory: document.attachmentCategory,
              parentTimeStamp: new Date().toDateString(),
              ...(document.documentLocked === undefined
                ? {}
                : { documentLocked: document.documentLocked }),
              ...(document.documentBytes === undefined
                ? {}
                : { documentBytes: document.documentBytes }),
            } as AttachmentDto;

            return mapUploadedDocument?.(attachment, document) ?? attachment;
          }) ?? [];
        onAttachmentsUploaded?.(attachments);
      } catch (error) {
        onUploadError(error);
      }
      return attachments;
    },
    [
      fallbackUploadId,
      id,
      mapUploadedDocument,
      onAttachmentsUploaded,
      onUploadError,
      startLongPolling,
      uploadIdRef,
    ],
  );

  return {
    uploading: uploadState.uploading,
    progress: uploadState.progress,
    setProgress: uploadState.setProgress,
    handleCancelFile,
    onUploadAttachments,
  };
}
