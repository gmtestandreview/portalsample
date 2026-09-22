import "./styles/index.scss";
import {
	createBrowserRouter,
	createRoutesFromElements,
	Route,
} from "react-router";
import AuthenticatedElement from "./authentication/AuthenticatedElement.tsx";
import ErrorDisplay from "./components/ErrorBoundary/ErrorDisplay.tsx";
import Home from "./components/Home.tsx";
import Layout from "./components/Layout/index.tsx";
import CreateAcceptQuote from "./routes/acceptQuote/create/index.tsx";
import AcceptQuote from "./routes/acceptQuote/index.tsx";
import SubmittedSuccess from "./routes/acceptQuote/submittedSuccess.tsx";
import AddBranch from "./routes/account/addBranch/index.tsx";
import CreateAccount from "./routes/account/create/index.tsx";
import AccountCreated from "./routes/account/created/index.tsx";
import UpdateAccount from "./routes/account/update/index.tsx";
import CreateContact from "./routes/contact/create/index.tsx";
import UpdateContact from "./routes/contact/update/index.tsx";
import DashboardTa from "./routes/dashboard/dashboard-ta.tsx";
import Dashboard from "./routes/dashboard/index.tsx";
import FaQs from "./routes/help-guide/faqs.tsx";
import HelpHowToSetupAccess from "./routes/help-guide/how-to-setup-access.tsx";
import HelpGuide from "./routes/help-guide/index.tsx";
import MeasurementReport from "./routes/measurementReport/index.tsx";
import InstrMeasurementReport from "./routes/measurementReport/indexList.tsx";
import PreConditions from "./routes/preConditions/PreConditions.tsx";
import Quotation from "./routes/quotation/index.tsx";
import CopyRequestForQuote from "./routes/requestForQuote/copy/index.tsx";
import CreateRequestForQuote from "./routes/requestForQuote/create/index.tsx";
import RequestForQuoteCreated from "./routes/requestForQuote/created/index.tsx";
import RequestForQuote from "./routes/requestForQuote/index.tsx";
import ViewRequestForQuoteSummary from "./routes/requestForQuote/viewRequestForQuoteSummary.tsx";
import ServicesWeOffer from "./routes/services-we-offer/index.tsx";
import SignIn from "./routes/sign-in/index.tsx";
import SignOut from "./routes/sign-out/index.tsx";
import SignOutHelper from "./routes/sign-out-helper/index.tsx";
import CreateRequestForTypeApproval from "./routes/ta/create/index.tsx";
import RequestForPatternApprovalCreated from "./routes/ta/created/index.tsx";
import ApplicationForTypeApproval from "./routes/ta/index.tsx";
import TaApplicationManage from "./routes/ta/manage/index.tsx";
import PreApplication from "./routes/ta/preApplication.tsx";
import { HttpStatusCode } from "./types.ts";

const App = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route
				path="/"
				element={
					<Layout>
						<Home />
					</Layout>
				}
			/>
			<Route
				path="/dashboard"
				element={
					<AuthenticatedElement>
						<Dashboard />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/dashboard-ta"
				element={
					<AuthenticatedElement>
						<DashboardTa />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/create-account/*"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<CreateAccount />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/update-organisation/:id/*"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<UpdateAccount />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/create-contact"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<CreateContact />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/update-contact/*"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<UpdateContact />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/success-creating-account"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<AccountCreated />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/add-branch/*"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<AddBranch />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/request-for-quote-create"
				element={
					<AuthenticatedElement>
						<CreateRequestForQuote />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/ta/type-approval-create-pre"
				element={
					<AuthenticatedElement>
						<PreApplication />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/ta/:id/*"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<ApplicationForTypeApproval />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/ta/type-approval-create"
				element={
					<AuthenticatedElement>
						<CreateRequestForTypeApproval />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/ta/type-approval-success/:id/*"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<RequestForPatternApprovalCreated />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/ta/:id/manage"
				element={
					<AuthenticatedElement>
						<TaApplicationManage />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/request-for-quote-copy/:id/*"
				element={
					<AuthenticatedElement>
						<CopyRequestForQuote />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/request-for-quote/:id/view-summary/*"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<ViewRequestForQuoteSummary name="" />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/request-for-quote/:id/*"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<RequestForQuote />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/request-for-quote-success/:id/*"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<RequestForQuoteCreated />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/submitted-success/:id/*"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<SubmittedSuccess />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/accept-quote-create/:id/*"
				element={
					<AuthenticatedElement>
						<CreateAcceptQuote />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/accept-quote/:id/*"
				element={
					<AuthenticatedElement displayHeaderAndFooter={false}>
						<AcceptQuote />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/quotation/:id/*"
				element={
					<AuthenticatedElement>
						<Quotation />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/instrument-reports/:id/*"
				element={
					<AuthenticatedElement>
						<InstrMeasurementReport />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/report/:id/*"
				element={
					<AuthenticatedElement>
						<MeasurementReport />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/services-we-offer"
				element={
					<AuthenticatedElement>
						<ServicesWeOffer />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/sign-in"
				element={
					<AuthenticatedElement>
						<SignIn />
					</AuthenticatedElement>
				}
			/>
			<Route path="/sign-out" element={<SignOut />} />
			<Route
				path="/sign-out-helper"
				element={
					<Layout>
						<SignOutHelper />
					</Layout>
				}
			/>
			<Route
				path="/help-guide"
				element={
					<Layout>
						<HelpGuide />
					</Layout>
				}
			/>
			<Route
				path="/help-guide/how-to-setup-access"
				element={
					<Layout>
						<HelpHowToSetupAccess />
					</Layout>
				}
			/>
			<Route
				path="/help-guide/faqs"
				element={
					<Layout>
						<FaQs />
					</Layout>
				}
			/>
			<Route
				path="/server-error"
				element={
					<PreConditions displayHeaderAndFooter={true}>
						<ErrorDisplay status={HttpStatusCode.InternalServerError} />
					</PreConditions>
				}
			/>
			<Route
				path="/conflict"
				element={
					<AuthenticatedElement>
						<ErrorDisplay status={HttpStatusCode.Conflict} />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/forbidden"
				element={
					<AuthenticatedElement>
						<ErrorDisplay status={HttpStatusCode.Forbidden} />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/no-longer-available"
				element={
					<AuthenticatedElement>
						<ErrorDisplay status={HttpStatusCode.Gone} />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/unprocessable"
				element={
					<AuthenticatedElement>
						<ErrorDisplay status={HttpStatusCode.UnprocessableEntity} />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/precondition-failed"
				element={
					<AuthenticatedElement>
						<ErrorDisplay status={HttpStatusCode.PreconditionFailed} />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/service-unavailable"
				element={
					<AuthenticatedElement>
						<ErrorDisplay status={HttpStatusCode.ServiceUnavailable} />
					</AuthenticatedElement>
				}
			/>
			<Route
				path="/not-found"
				element={
					<PreConditions displayHeaderAndFooter={true}>
						<ErrorDisplay status={HttpStatusCode.NotFound} />
					</PreConditions>
				}
			/>
			<Route
				path="*"
				element={
					<PreConditions displayHeaderAndFooter={true}>
						<ErrorDisplay status={HttpStatusCode.NotFound} />
					</PreConditions>
				}
			/>
		</>,
	),
	{
		future: {
			v7_relativeSplatPath: true,
			v7_fetcherPersist: true,
			v7_normalizeFormMethod: true,
			v7_partialHydration: true,
			v7_skipActionErrorRevalidation: true,
		},
	},
);

export default App;
