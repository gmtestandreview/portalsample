import { InteractionStatus } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link, useParams } from "react-router";
import type { PagedListOfInstrumentArtefactDto } from "../../api/web-api-client.ts";
import { DashboardClient } from "../../api/web-api-client.ts";
import { tokenRequest } from "../../authentication/authConfig.ts";
import { useAccountState } from "../../authentication/hooks.tsx";
import BlockUiSpinner from "../../components/BlockUISpinner/index.tsx";
import type { CustomBreadcrumbItem } from "../../components/Breadcrumb/index.tsx";
import CustomBreadcrumb from "../../components/Breadcrumb/index.tsx";
import HeaderIntroText from "../../components/HeaderIntroText/index.tsx";
import useBodyClass from "../../components/Utilities/useBodyClass.tsx";
import useHtmlTitle from "../../components/Utilities/useHtmlTitle.tsx";
import AppLogger from "../../instrumentation/AppLogger.ts";
import { handleReportFileError } from "../common/helperFunctions.ts";
import ReportList from "./reportList.tsx";

const InstrMeasurementReport = () => {
	const { id } = useParams<{ id?: string }>();
	const { inProgress, accounts, instance } = useMsal();
	const [isLoading, setIsLoading] = useState(false);
	const [_reload, setReload] = useState(false);
	const [measurementReportData, setMeasurementReportData] =
		useState<PagedListOfInstrumentArtefactDto>();
	const [_fileError, setFileError] = useState(false);
	const accountContext = useAccountState();
	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;

	const breadcrumbs: CustomBreadcrumbItem[] = [
		{ to: "/", text: "Dashboard" },
		{ to: "", text: "Instrument/artefact reports" },
	];

	const _crmGuid = accountContext?.details?.organisationCRMGuid;

	useEffect(() => {
		const getReportList = async (portalId: string) => {
			try {
				AppLogger.verbose("MeasurementReport.getReportList", { Id: id });
				const client = new DashboardClient();
				const tokenResult = await instance.acquireTokenSilent({
					...tokenRequest,
					account: accounts[0],
				});
				client.setAuthToken(tokenResult.accessToken);

				const details =
					await client.getDashboardInstrumentArtefactReportsByPortalIDAndArtefactName(
						portalId,
						id,
						pageSize,
						currentPage,
					);
				setMeasurementReportData(details);
			} catch (e) {
				handleReportFileError();
				setFileError(true);
				setIsLoading(false);
				AppLogger.error("Failed to get Measurement report data", e as Error, {
					Id: id,
				});
			}
		};
		const loadDataForDisplay = async () => {
			if (accountContext?.details?.organisationCRMGuid) {
				if (inProgress === InteractionStatus.None && accounts.length > 0) {
					setIsLoading(true);
					await getReportList(accountContext.details?.organisationCRMGuid);
					setIsLoading(false);
					setReload(false);
				}
			}
		};
		loadDataForDisplay();
	}, [
		accountContext,
		accounts.length,
		inProgress,
		accounts,
		instance,
		id,
		currentPage,
	]);

	useHtmlTitle(
		"Instrument/artefact reports - Testing and calibration service | NMI Services portal",
	);
	useBodyClass("reports");

	const renderInstrMeasurementReport = () => (
		<>
			{measurementReportData && (
				<ReportList
					pagedListArtefactData={measurementReportData}
					setCurrentPage={setCurrentPage}
				/>
			)}
		</>
	);

	return (
		<>
			{isLoading && (
				<BlockUiSpinner>
					<p>Loading...</p>
				</BlockUiSpinner>
			)}

			<div aria-busy={isLoading} aria-live="polite">
				<Container fluid={true} className="default-banner-background mb-5">
					<Container>
						<Row>
							<Col>
								<CustomBreadcrumb breadcrumbs={breadcrumbs} />
							</Col>
						</Row>
						<Row className="gs-wrapper-sm">
							<Col md={12} lg={9}>
								<h1 id="page-title" tabIndex={-1} className="banner-title mb-2">
									{id}
								</h1>
								<HeaderIntroText>
									<strong>Testing and calibration service</strong>
								</HeaderIntroText>
							</Col>
						</Row>
					</Container>
				</Container>
				<Container>{renderInstrMeasurementReport()}</Container>
				<Container>
					<Row className="mb-4">
						<div className="mt-5 d-grid w-100 gap-3 d-md-flex justify-content-md-between">
							<Link
								data-testid="go-to-dashboard-button"
								to="/dashboard"
								replace={true}
								className="btn btn-tertiary order-2 order-md-0"
							>
								<i className="icon-back me-1" aria-hidden="true" />
								{" Back to dashboard"}
							</Link>
							{/* <Link
                                data-testid='request-for-quote-copy-button'
                                to={`/request-for-quote-copy/${undefined}`}
                                className='btn btn-secondary'
                            >
                                Request recalibration
                            </Link> */}
						</div>
					</Row>
				</Container>
			</div>
		</>
	);
};

export default InstrMeasurementReport;
