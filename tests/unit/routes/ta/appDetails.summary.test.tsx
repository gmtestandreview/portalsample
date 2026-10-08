import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';
import {
  PatternApprovalRequiredValues,
  YesNo,
} from '../../../../ClientApp/src/api/web-api-client';
import { resetMsalMock } from '../../helpers/mockMsal';
import type { ClientMockOf } from '../../helpers/mockApiClient';
import { renderWithRouter } from '../../helpers/renderWithRouter';

const clients = vi.hoisted(() => ({
  patternApproval: undefined as unknown as ClientMockOf<
    'getAppMessageCount' | 'getAppDetails'
  >,
}));

vi.mock('@azure/msal-react', async () => {
  const { msalReactModuleMock } = await import('../../helpers/mockMsal');

  return msalReactModuleMock();
});

vi.mock(
  '../../../../ClientApp/src/api/web-api-client',
  async (importOriginal) => {
    const { createClientMockFor, webApiClientModuleMock } =
      await import('../../helpers/mockApiClient');
    const original = await importOriginal<typeof WebApiClient>();

    clients.patternApproval = createClientMockFor(
      'getAppMessageCount',
      'getAppDetails'
    );

    return webApiClientModuleMock(original, {
      RequestForPatternApprovalClient: clients.patternApproval,
    });
  }
);

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
  tokenRequest: { scopes: ['api://ta/.default'] },
}));

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
  default: { error: vi.fn(), info: vi.fn(), verbose: vi.fn() },
}));

// The real accordion collapses its body; the summary inside it is what is under test.
vi.mock('../../../../ClientApp/src/components/Accordion', () => ({
  CustomAccordion: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  CustomAccordionBody: ({
    name,
    children,
  }: {
    name: string;
    children: ReactNode;
  }) => <section aria-label={name}>{children}</section>,
}));

vi.mock('../../../../ClientApp/src/routes/ta/manage/appDocuments', () => ({
  default: () => <div data-testid='application-documents' />,
}));

vi.mock('../../../../ClientApp/src/routes/ta/manage/appMessages', () => ({
  default: () => <div data-testid='application-messages' />,
}));

const details = {
  applicationDetails: { referenceId: 'PA-001', title: 'Balance approval' },
  organisationAndContact: {
    isManufacturer: YesNo.Yes,
    name: 'Acme Pty Ltd',
    isPrincipalContact: YesNo.Yes,
    isPrincipalInvoiceContact: YesNo.Yes,
  },
  applicationAndInstrument: {
    patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
    summary: 'Provisional please',
  },
  supportingDocuments: {
    form: {
      documents: [
        {
          id: 'doc-1',
          attachmentName: 'spec.pdf',
          attachmentSize: '2048',
          attachmentCategory: 'Manuals',
        },
      ],
    },
  },
};

describe('application details summary', () => {
  beforeEach(() => {
    resetMsalMock();
    clients.patternApproval.methods.getAppMessageCount.mockResolvedValue(0);
    clients.patternApproval.methods.getAppDetails.mockResolvedValue(details);
  });

  it('shows the loaded organisation, application and documents without a Formik form', async () => {
    const ApplicationDetails = (
      await import('../../../../ClientApp/src/routes/ta/manage/appDetails')
    ).default;

    renderWithRouter(<ApplicationDetails />, {
      path: '/ta/manage/:id',
      initialPath: '/ta/manage/APP-1',
    });

    const organisation = await screen.findByRole('region', {
      name: 'Organisation details',
    });
    expect(within(organisation).getByText('Acme Pty Ltd')).toBeInTheDocument();

    const application = screen.getByRole('region', {
      name: 'Application details',
    });
    expect(
      within(application).getByText('Provisional please')
    ).toBeInTheDocument();

    const documents = screen.getByRole('region', {
      name: 'Supporting documents',
    });
    expect(within(documents).getByText('spec.pdf')).toBeInTheDocument();
    // Read-only here: the category is text, not a select.
    expect(within(documents).getByText('Manuals')).toBeInTheDocument();
    expect(within(documents).queryByRole('combobox')).not.toBeInTheDocument();
  });
});
