import './styles/index.scss';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router';
import AuthenticatedElement from './authentication/AuthenticatedElement';
import Home from './components/Home';
import Dashboard from './routes/dashboard';
import SignIn from './routes/sign-in';
import SignOut from './routes/sign-out';
import ServicesWeOffer from './routes/services-we-offer';
import RequestForQuote from './routes/requestForQuote';
import CreateAccount from './routes/account/create';
import UpdateAccount from './routes/account/update';
import Layout from './components/Layout';
import CreateRequestForQuote from './routes/requestForQuote/create';
import AccountCreated from './routes/account/created';
import AddBranch from './routes/account/addBranch';
import RequestForQuoteCreated from './routes/requestForQuote/created';
import ViewRequestForQuoteSummary from './routes/requestForQuote/viewRequestForQuoteSummary';
import Quotation from './routes/quotation';
import AcceptQuote from './routes/acceptQuote';
import CreateAcceptQuote from './routes/acceptQuote/create';
import SubmittedSuccess from './routes/acceptQuote/submittedSuccess';
import MeasurementReport from './routes/measurementReport';
import InstrMeasurementReport from './routes/measurementReport/indexList';
import SignOutHelper from './routes/sign-out-helper';
import UpdateContact from './routes/contact/update';
import ErrorDisplay from './components/ErrorBoundary/ErrorDisplay';
import { HttpStatusCode } from './types';
import PreConditions from './routes/preConditions/PreConditions';
import CopyRequestForQuote from './routes/requestForQuote/copy';
import HelpGuide from './routes/help-guide';
import HelpHowToSetupAccess from './routes/help-guide/how-to-setup-access';
import FAQs from './routes/help-guide/faqs';
import CreateContact from './routes/contact/create';
import CreateRequestForTypeApproval from './routes/ta/create';
import PreApplication from './routes/ta/preApplication';
import ApplicationForTypeApproval from './routes/ta';
import RequestForPatternApprovalCreated from './routes/ta/created';
import TAApplicationManage from './routes/ta/manage';
import DashboardTA from './routes/dashboard/dashboard-ta';

const App = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route path='/' element={<Layout><Home /></Layout>} />
            <Route
                path='/dashboard'
                element={(
                    <AuthenticatedElement>
                        <Dashboard />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/dashboard-ta'
                element={(
                    <AuthenticatedElement>
                        <DashboardTA />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/create-account/*'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <CreateAccount />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/update-organisation/:id/*'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <UpdateAccount />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/create-contact'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <CreateContact />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/update-contact/*'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <UpdateContact />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/success-creating-account'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <AccountCreated />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/add-branch/*'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <AddBranch />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/request-for-quote-create'
                element={(
                    <AuthenticatedElement>
                        <CreateRequestForQuote />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/ta/type-approval-create-pre'
                element={(
                    <AuthenticatedElement>
                        <PreApplication />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/ta/:id/*'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <ApplicationForTypeApproval />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/ta/type-approval-create'
                element={(
                    <AuthenticatedElement>
                        <CreateRequestForTypeApproval />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/ta/type-approval-success/:id/*'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <RequestForPatternApprovalCreated />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/ta/:id/manage'
                element={(
                    <AuthenticatedElement>
                        <TAApplicationManage />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/request-for-quote-copy/:id/*'
                element={(
                    <AuthenticatedElement>
                        <CopyRequestForQuote />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/request-for-quote/:id/view-summary/*'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <ViewRequestForQuoteSummary name='' />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/request-for-quote/:id/*'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <RequestForQuote />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/request-for-quote-success/:id/*'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <RequestForQuoteCreated />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/submitted-success/:id/*'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <SubmittedSuccess />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/accept-quote-create/:id/*'
                element={(
                    <AuthenticatedElement>
                        <CreateAcceptQuote />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/accept-quote/:id/*'
                element={(
                    <AuthenticatedElement displayHeaderAndFooter={false}>
                        <AcceptQuote />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/quotation/:id/*'
                element={(
                    <AuthenticatedElement>
                        <Quotation />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/instrument-reports/:id/*'
                element={(
                    <AuthenticatedElement>
                        <InstrMeasurementReport />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/report/:id/*'
                element={(
                    <AuthenticatedElement>
                        <MeasurementReport />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/services-we-offer'
                element={(
                    <AuthenticatedElement>
                        <ServicesWeOffer />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/sign-in'
                element={(
                    <AuthenticatedElement>
                        <SignIn />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/sign-out'
                element={(
                    <SignOut />
                )}
            />
            <Route
                path='/sign-out-helper'
                element={(
                    <Layout>
                        <SignOutHelper />
                    </Layout>
                )}
            />
            <Route
                path='/help-guide'
                element={(
                    <Layout>
                        <HelpGuide />
                    </Layout>
                )}
            />
            <Route
                path='/help-guide/how-to-setup-access'
                element={(
                    <Layout>
                        <HelpHowToSetupAccess />
                    </Layout>
                )}
            />
            <Route
                path='/help-guide/faqs'
                element={(
                    <Layout>
                        <FAQs />
                    </Layout>
                )}
            />
            <Route
                path='/server-error'
                element={(
                    <PreConditions displayHeaderAndFooter>
                        <ErrorDisplay status={HttpStatusCode.InternalServerError} />
                    </PreConditions>

                )}
            />
            <Route
                path='/conflict'
                element={(
                    <AuthenticatedElement>
                        <ErrorDisplay status={HttpStatusCode.Conflict} />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/forbidden'
                element={(
                    <AuthenticatedElement>
                        <ErrorDisplay status={HttpStatusCode.Forbidden} />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/no-longer-available'
                element={(
                    <AuthenticatedElement>
                        <ErrorDisplay status={HttpStatusCode.Gone} />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/unprocessable'
                element={(
                    <AuthenticatedElement>
                        <ErrorDisplay status={HttpStatusCode.UnprocessableEntity} />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/precondition-failed'
                element={(
                    <AuthenticatedElement>
                        <ErrorDisplay status={HttpStatusCode.PreconditionFailed} />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/service-unavailable'
                element={(
                    <AuthenticatedElement>
                        <ErrorDisplay status={HttpStatusCode.ServiceUnavailable} />
                    </AuthenticatedElement>
                )}
            />
            <Route
                path='/not-found'
                element={(
                    <PreConditions displayHeaderAndFooter>
                        <ErrorDisplay status={HttpStatusCode.NotFound} />
                    </PreConditions>
                )}
            />
            <Route
                path='*'
                element={(
                    <PreConditions displayHeaderAndFooter>
                        <ErrorDisplay status={HttpStatusCode.NotFound} />
                    </PreConditions>
                )}
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
