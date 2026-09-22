import { InteractionStatus } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router";
import type { RequestForQuoteDetails } from "../../api/web-api-client.ts";
import { ApplicationType, QuoteClient } from "../../api/web-api-client.ts";
import { tokenRequest } from "../../authentication/authConfig.ts";
import { useAccountState } from "../../authentication/hooks.tsx";
import NotificationMessage from "../../components/Alert/NotificationMessage.tsx";
import BlockUiSpinner from "../../components/BlockUISpinner/index.tsx";
import type { CustomBreadcrumbItem } from "../../components/Breadcrumb/index.tsx";
import CustomBreadcrumb from "../../components/Breadcrumb/index.tsx";
import HeaderIntroText from "../../components/HeaderIntroText/index.tsx";
import useBodyClass from "../../components/Utilities/useBodyClass.tsx";
import useHtmlTitle from "../../components/Utilities/useHtmlTitle.tsx";
import ViewMeasurementReport from "../../components/Utilities/ViewMeasurementReport.tsx";
import AppLogger from "../../instrumentation/AppLogger.ts";
import {
	clearDashboardInfoNotification,
	clearDashboardNotification,
	getDashboardInfoNotification,
	getDashboardNotification,
} from "../../storage/notification.ts";
import { handleReportFileError } from "../common/helperFunctions.ts";
import NmiContactDetails from "./nMIContactDetails.tsx";
import ReportDetails from "./reportDetails.tsx";

const showDashboardMessage = (message: JSX.Element | null) => (
	<>
		{message && (
			<Container>
				<Row>
					<Col>{message}</Col>
				</Row>
			</Container>
		)}
	</>
);

const setNotification = () => {
	const dashboardNotification = getDashboardNotification();
	return dashboardNotification ? (
		<NotificationMessage
			id="notif-message-1"
			canClose={true}
			onClose={clearDashboardNotification}
			{...dashboardNotification}
		/>
	) : null;
};

const setInfoNotification = () => {
	const dashboardInfoNotification = getDashboardInfoNotification();
	return dashboardInfoNotification ? (
		<NotificationMessage
			id="notif-info-message-2"
			canClose={true}
			onClose={clearDashboardInfoNotification}
			{...dashboardInfoNotification}
		/>
	) : null;
};

const MeasurementReport = () => {
	const { id } = useParams<{ id?: string }>();
	const { inProgress, accounts, instance } = useMsal();
	const [isLoading, setIsLoading] = useState(false);
	const [_reload, setReload] = useState(false);
	const [measurementReportData, setMeasurementReportData] = useState<
		RequestForQuoteDetails | undefined
	>();
	const [fileError, setFileError] = useState(false);
	const accountState = useAccountState();
	const dashboardMessage = setNotification();
	const dashboardInfoMessage = setInfoNotification();
	const navigate = useNavigate();

	const breadcrumbs: CustomBreadcrumbItem[] = [
		{ to: "/", text: "Dashboard" },
		{ to: "", text: "Testing and calibration service - Report" },
	];

	const _targetOrganisationAbn =
		accountState?.details?.targetOrganisation?.targetOrganisationAbn;

	useEffect(() => {
		const getReportDetails = async () => {
			try {
				AppLogger.verbose("MeasurementReport.getReportDetails", { Id: id });
				const client = new QuoteClient();
				const tokenResult = await instance.acquireTokenSilent({
					...tokenRequest,
					account: accounts[0],
				});
				client.setAuthToken(tokenResult.accessToken);
				const details = await client.getQuoteRequestDetailsByRefId(
					ApplicationType.QuoteAccept,
					id,
				);
				setMeasurementReportData(details);
			} catch (e) {
				handleReportFileError();
				setFileError(true);
				setIsLoading(false);
				AppLogger.error("Failed to get Measurement report data", e as Error, {
					Id: id,
				});
				navigate("/not-found");
			}
		};
		const loadDataForDisplay = async () => {
			if (accountState?.details?.targetOrganisation?.targetOrganisationAbn) {
				if (inProgress === InteractionStatus.None && accounts.length > 0) {
					setIsLoading(true);
					await getReportDetails();
					setIsLoading(false);
					setReload(false);
				}
			}
		};
		loadDataForDisplay();
	}, [
		accountState,
		accounts.length,
		inProgress,
		accounts,
		instance,
		id,
		navigate,
	]);

	useHtmlTitle(
		"Report - Testing and calibration service | NMI Services portal",
	);
	useBodyClass("report");

	clearDashboardInfoNotification();
	const renderMeasurementReport = () => (
		<>
			<ReportDetails reportData={measurementReportData} fileError={fileError} />
			<Row className="mb-3">
				<Col md={12}>
					<div className="d-grid w-100 gap-1 d-md-flex flex-column justify-content-md-between text-end">
						<ViewMeasurementReport
							text="View report PDF"
							quotationData={measurementReportData}
							setFileError={setFileError}
							setIsLoading={setIsLoading}
						/>
					</div>
				</Col>
			</Row>
			<NmiContactDetails quotationData={measurementReportData} />
		</>
	);

	return (
		<>
			{isLoading && (
				<BlockUiSpinner>
					<p>Loading...</p>
				</BlockUiSpinner>
			)}
			{!fileError && showDashboardMessage(dashboardMessage)}
			{!fileError && showDashboardMessage(dashboardInfoMessage)}
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
									Report
								</h1>
								<HeaderIntroText>
									<strong>Testing and calibration service</strong>
								</HeaderIntroText>
							</Col>
						</Row>
					</Container>
				</Container>
				<Container>{renderMeasurementReport()}</Container>
				<Container>
					<Row className="mb-4">
						<div className="d-grid d-md-block">
							<Link
								data-testid="go-to-dashboard-button"
								to="/dashboard"
								replace={true}
								className="btn btn-tertiary"
							>
								<i className="icon-back me-1" aria-hidden="true" /> Back to
								dashboard
							</Link>
						</div>
					</Row>
				</Container>
			</div>
		</>
	);
};

export default MeasurementReport;
