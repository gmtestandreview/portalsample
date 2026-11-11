import { http, HttpResponse } from 'msw/http';
import { expect } from 'storybook/test';
import preview from '../../../../.storybook/preview';
import type { RequestForQuoteDetails } from '../../api/web-api-client';
import { withPortalProviders } from '../../storybook/storybookHarness';
import { requestForQuoteDetailsFixture } from '../../storybook/storybookFixtures';
import SubmittedSuccess from '../acceptQuote/submittedSuccess';
import AccountCreatedRoute from '../account/created';
import ContactDetailsRoute from '../contact/contactDetails';
import FaqsRoute from '../help-guide/faqs';
import SetupAccessRoute from '../help-guide/how-to-setup-access';
import HelpGuide from '../help-guide';
import ReportContact from '../common/NMIContactDetails';
import ReportDetails from '../measurementReport/reportDetails';
import RequestForQuoteCreatedRoute from '../requestForQuote/created';
import SignIn from '../sign-in';
import SignOutHelper from '../sign-out-helper';
import SignOut from '../sign-out';
import TypeApprovalManageRoute from '../ta/manage';

/**
 * Mount coverage for route modules whose behaviour is exercised in depth
 * elsewhere. Each story renders one route export under the portal providers
 * (router, MSAL, account and modal state) and asserts content the route itself
 * owns, so a route that stops mounting, or loses its primary content, fails
 * here. The `route-wrapper-mounted` message names the contract in the failure
 * output.
 */
const reportData: RequestForQuoteDetails = requestForQuoteDetailsFixture;

const applicationDetails = {
  patternApprovalType: 'Non-automatic weighing instrument',
  messageCount: 0,
  referenceId: 'PA-2024-0001',
  status: 'Submitted',
  statusDetail: 'Under assessment by NMI',
  title: 'Non-automatic weighing instrument',
  submittedDate: '2024-03-01T00:00:00Z',
  lastUpdated: '2024-03-20T00:00:00Z',
  assessedAs: 'Class II',
};

const manageFetch: typeof globalThis.fetch = (input) => {
  let url: string;
  if (typeof input === 'string') {
    url = input;
  } else if ('url' in input) {
    url = input.url;
  } else {
    url = input.href;
  }
  const body = url.includes('app-details')
    ? JSON.stringify({ applicationDetails })
    : '0';
  return Promise.resolve(
    new Response(body, {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
};

const meta = preview.meta({
  title: 'Routes/ExportCoverage',
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: { authenticated: true },
  },
});

export const AcceptQuoteSubmitted = meta.story({
  render: () => <SubmittedSuccess />,
  parameters: {
    portal: {
      routePath: '/accept-quote/:id/submitted',
      initialEntries: ['/accept-quote/QA-2024-000900/submitted'],
    },
  },
  beforeEach({ msw }) {
    msw.use(
      http.get('/api/accept-quote/:id/payment-details', () =>
        HttpResponse.json({ acceptQuotePreInfo: { paymentTerms: 'Prepaid' } }),
      ),
    );
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', {
        name: 'Your accepted quote has been successfully submitted',
      }),
      'route-wrapper-mounted',
    ).toBeVisible();
    await expect(await canvas.findByText('Prepayment required')).toBeVisible();
  },
});

export const AccountCreated = meta.story({
  render: () => <AccountCreatedRoute />,
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', {
        name: /your portal account is ready/i,
      }),
      'route-wrapper-mounted',
    ).toBeVisible();
    await expect(canvas.getByTestId('go-to-dashboard-button')).toBeVisible();
  },
});

export const ContactDetails = meta.story({
  render: () => <ContactDetailsRoute />,
  parameters: {
    portal: { formik: { initialValues: { contact: {} } } },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { level: 2, name: 'Contact' }),
      'route-wrapper-mounted',
    ).toBeVisible();
    await expect(canvas.getByTestId('info-summary')).toBeVisible();
  },
});

export const HelpFaqs = meta.story({
  render: () => <FaqsRoute />,
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', {
        level: 1,
        name: 'Frequently Asked Questions (FAQs)',
      }),
      'route-wrapper-mounted',
    ).toBeVisible();
  },
});

export const HelpSetupAccess = meta.story({
  render: () => <SetupAccessRoute />,
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', {
        level: 1,
        name: /how to set up access to the nmi services portal/i,
      }),
      'route-wrapper-mounted',
    ).toBeVisible();
  },
});

export const HelpGuideRoute = meta.story({
  render: () => <HelpGuide />,
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Help guide' }),
      'route-wrapper-mounted',
    ).toBeVisible();
  },
});

export const MeasurementReportContact = meta.story({
  render: () => <ReportContact
      heading='Contact your NMI test officer if you have any questions about the report outcomes.'
      quotationData={reportData}
    />,
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', {
        name: /contact your nmi test officer/i,
      }),
      'route-wrapper-mounted',
    ).toBeVisible();
    await expect(canvas.getByText('Jordan Officer')).toBeVisible();
  },
});

export const MeasurementReportDetails = meta.story({
  render: () => <ReportDetails reportData={reportData} fileError={false} />,
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Measurement report' }),
      'route-wrapper-mounted',
    ).toBeVisible();
    await expect(canvas.getByTestId('info-summary')).toBeVisible();
  },
});

export const RequestForQuoteCreated = meta.story({
  render: () => <RequestForQuoteCreatedRoute />,
  parameters: {
    portal: {
      routePath: '/request-for-quote/:id/created',
      initialEntries: ['/request-for-quote/RFQ-2024-000892/created'],
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', {
        name: 'Your request has been submitted',
      }),
      'route-wrapper-mounted',
    ).toBeVisible();
    await expect(canvas.getByText('Ref ID: RFQ-2024-000892')).toBeVisible();
  },
});

export const SignInRoute = meta.story({
  render: () => <SignIn />,
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Logging in...' }),
      'route-wrapper-mounted',
    ).toBeVisible();
  },
});

export const SignOutHelperRoute = meta.story({
  render: () => <SignOutHelper />,
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', {
        name: /to complete your log out, close your browser window/i,
      }),
      'route-wrapper-mounted',
    ).toBeVisible();
    await expect(canvas.getByTestId('back-to-nmi-org-button')).toBeVisible();
  },
});

export const SignOutRoute = meta.story({
  render: () => <SignOut />,
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText('Logging out...'),
      'route-wrapper-mounted',
    ).toBeVisible();
  },
});

export const TypeApprovalManage = meta.story({
  render: () => <TypeApprovalManageRoute />,
  parameters: {
    portal: {
      routePath: '/ta/:id/manage',
      initialEntries: ['/ta/PA-2024-0001/manage'],
      fetch: manageFetch,
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Application status' }),
      'route-wrapper-mounted',
    ).toBeInTheDocument();
    await expect(await canvas.findByText('PA-2024-0001')).toBeVisible();
  },
});
