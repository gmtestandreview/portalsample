import { useMsal } from "@azure/msal-react";
import { Formik } from "formik";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { useParams } from "react-router";
import {
	type AttachmentDto,
	type FileParameter,
	ProgressClient,
	RequestForPatternApprovalClient,
	type SupportingDocumentsStep,
	type UploadProgress,
} from "../../../api/web-api-client.ts";
import { tokenRequest } from "../../../authentication/authConfig.ts";
import BlockUiSpinner from "../../../components/BlockUISpinner/index.tsx";
import useBodyClass from "../../../components/Utilities/useBodyClass.tsx";
import useHtmlTitle from "../../../components/Utilities/useHtmlTitle.tsx";
import AppLogger from "../../../instrumentation/AppLogger.ts";
import SupportingDocuments from "../supportingDocuments.tsx";
import { supportingDocsSubmitValidation } from "../validation.ts";

/**
 * Backoff between failed progress polls. Without it a persistently failing endpoint turns the
 * retry path into a tight loop that pegs a core and hammers the failing service.
 */
const PROGRESS_RETRY_DELAY_MS = 2000;

const ApplicationDocuments = () => {
	const { accounts, instance } = useMsal();
	const { id } = useParams();
	const [isDataLoading, setIsDataLoading] = useState(false);

	useHtmlTitle(`[New certificate] (${id}) manage | NMI Services portal`);
	useBodyClass("pa-application-manage");

	// SupportingDocuments upload state and handlers (from ta/index.tsx)
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState<UploadProgress | undefined>(
		undefined,
	);
	const abortRef = useRef<AbortController | null>(null);
	const uploadIdRef = useRef<string | null>(null);

	// State for Formik initialValues (existing docs)
	const [filesUploaded, setFilesUploaded] =
		useState<SupportingDocumentsStep | null>(null);
	const [filesToCommit, setFilesToCommit] = useState<boolean>(false);
	const [commitSuccess, setCommitSuccess] = useState<boolean>(false);
	const [submitErrors, setSubmitErrors] = useState<string[]>([]);

	useEffect(() => {
		const fetchDocs = async () => {
			setIsDataLoading(true);
			try {
				if (accounts.length > 0 && id) {
					const client = new RequestForPatternApprovalClient();
					const tokenResult = await instance.acquireTokenSilent({
						...tokenRequest,
						account: accounts[0],
					});
					client.setAuthToken(tokenResult.accessToken);
					const response = await client.getAppDocuments(id);
					setFilesUploaded(response);
					setFilesToCommit(
						response?.form?.documents?.some((doc) => !doc.documentLocked) ??
							false,
					);
				}
			} catch (e) {
				AppLogger.error("Failed to load application documents", e as Error, {
					Id: id,
				});
			} finally {
				setIsDataLoading(false);
				setCommitSuccess(false);
			}
		};
		fetchDocs();
	}, [accounts, id, instance, commitSuccess]);

	// Without this the controller stored below is never aborted, so the progress loop's
	// `while (!controller.signal.aborted)` can never exit and its `if (aborted) break` never fires.
	// The poll then outlives the component, and against a failing endpoint spins with no delay.
	useEffect(
		() => () => {
			if (abortRef.current) {
				abortRef.current.abort();
			}
		},
		[],
	);

	const startLongPolling = useCallback(
		async (uploadId: string) => {
			const controller = new AbortController();
			abortRef.current = controller;
			let lastPercent = -1;
			const client = new ProgressClient();
			const tokenResult = await instance.acquireTokenSilent({
				...tokenRequest,
				account: accounts[0],
			});
			while (!controller.signal.aborted) {
				try {
					client.setAuthToken(tokenResult.accessToken);
					const data = await client.getProgress(
						uploadId,
						lastPercent,
						controller.signal,
					);
					setProgress(data);
					lastPercent = data.percent!;

					if (
						data.status === "Completed" ||
						data.status === "CompletedWithErrors"
					) {
						setUploading(false);
						client.deleteProgressStatistics(uploadId).catch((error) => {
							AppLogger.error(
								"Failed to delete progress statistics",
								error as Error,
								{ uploadId },
							);
						});
						break;
					}
				} catch {
					if (controller.signal.aborted) break;
					await new Promise((resolve) => {
						setTimeout(resolve, PROGRESS_RETRY_DELAY_MS);
					});
				}
			}
		},
		[accounts, instance],
	);

	const handleCancelFile = async (fileName: string) => {
		if (!uploadIdRef.current) return;
		try {
			const client = new ProgressClient();
			const tokenResult = await instance.acquireTokenSilent({
				...tokenRequest,
				account: accounts[0],
			});
			client.setAuthToken(tokenResult.accessToken);
			await client.cancelFile(uploadIdRef.current, fileName);
		} catch {
			// Cancellation is best-effort; progress polling will reflect the final state
		}
	};

	const onUploadAttachments = async (
		token: string,
		fileData: FileParameter[],
	): Promise<AttachmentDto[]> => {
		let attachments = [] as AttachmentDto[];
		try {
			const clientProgress = new ProgressClient();
			clientProgress.setAuthToken(token);
			const uploadId = await clientProgress.getProgressUploadId();
			uploadIdRef.current = uploadId;
			if (uploadIdRef.current) {
				startLongPolling(uploadIdRef.current);
			}
			const clientPa = new RequestForPatternApprovalClient();
			clientPa.setAuthToken(token);
			const result = await clientPa.addDocuments(
				id,
				null,
				uploadId,
				fileData,
				null,
				null,
			);
			const { documents } = result.form || {};
			uploadIdRef.current = result.uploadId!;

			attachments =
				documents?.map(
					(x) =>
						({
							id: x.id,
							documentReference: x.id,
							attachmentType: x.attachmentType,
							attachmentMimeType: x.attachmentMimeType,
							attachmentSize: x.attachmentSize,
							attachmentName: x.attachmentName,
							attachmentUrl: x.attachmentUrl,
							attachmentCategory: x.attachmentCategory,
							parentTimeStamp: new Date().toDateString(),
							documentLocked: x.documentLocked,
							documentBytes: x.documentBytes,
						}) as AttachmentDto,
				) ?? [];
			setFilesToCommit(attachments.some((doc) => !doc.documentLocked));
		} catch (error) {
			AppLogger.error("Failed to load application documents", error as Error, {
				Id: id,
			});
		}
		return attachments;
	};

	return (
		<Row className="mb-4" id="application-documents">
			<Col aria-busy={isDataLoading} aria-live="polite">
				{isDataLoading ? (
					<BlockUiSpinner>
						<p>Loading...</p>
					</BlockUiSpinner>
				) : (
					<div className="appl-items mb-5">
						<h2 className="visually-hidden">Documents</h2>
						<Formik
							enableReinitialize={true}
							initialValues={{
								form: {
									documents: filesUploaded?.form?.documents || [],
									instrumentCategory:
										filesUploaded?.form?.instrumentCategory || undefined,
									instrumentType:
										filesUploaded?.form?.instrumentType || undefined,
								},
							}}
							validationSchema={supportingDocsSubmitValidation}
							onSubmit={async (values) => {
								try {
									setIsDataLoading(true);
									const client = new RequestForPatternApprovalClient();
									const tokenResult = await instance.acquireTokenSilent({
										...tokenRequest,
										account: accounts[0],
									});
									client.setAuthToken(tokenResult.accessToken);
									values.form.documents.forEach((doc) => {
										doc.documentBytes = undefined; // Clear out bytes to avoid unnecessarily large payloads
									});
									await client.commitAppDocuments(id!, values);
									setCommitSuccess(true);
								} catch (e: any) {
									const status = (e as any)?.status as number | undefined;

									if (status === 403) {
										setSubmitErrors([
											"Upload blocked for security reasons. Please rename the file and try again. If the issue continues, contact support.",
										]);
									} else if (status && status >= 500) {
										setSubmitErrors([
											"A server error occurred. Please try again.",
										]);
									} else {
										setSubmitErrors(["Failed to commit documents."]);
									}

									AppLogger.error(
										"Failed to load application documents",
										e as Error,
										{ Id: id, Status: status },
									);
								} finally {
									setIsDataLoading(false);
								}
							}}
						>
							{({ submitForm }) => (
								<>
									<SupportingDocuments
										isSummary={false}
										suppressDocChanges={true}
										name="form.documents"
										onUploadAttachment={onUploadAttachments}
										attachment={{
											onUploadFiles: () => Promise.resolve([]), // Not used
										}}
										progress={progress}
										setProgress={setProgress}
										uploading={uploading}
										handleCancelFile={handleCancelFile}
										disableUpload={
											filesUploaded?.form?.applicationStatus === "Completed"
										}
										externalErrors={submitErrors}
										setExternalErrors={setSubmitErrors}
									/>
									<Row>
										<Col md={12} className="text-end">
											{!isDataLoading && filesToCommit && (
												<Button
													variant="primary"
													onClick={(e) => {
														e.preventDefault();
														submitForm();
													}}
												>
													Commit
												</Button>
											)}
										</Col>
									</Row>
								</>
							)}
						</Formik>
					</div>
				)}
			</Col>
		</Row>
	);
};

export default ApplicationDocuments;
