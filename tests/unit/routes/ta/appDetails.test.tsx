import { act, screen, waitFor, within } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComponentProps, ReactNode } from 'react';

import type * as ReactBootstrap from 'react-bootstrap';

import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';

import {
  resetMsalMock,
  signOut,
  DEFAULT_ACCESS_TOKEN,
} from '../../helpers/mockMsal';

import type { ClientMockOf } from '../../helpers/mockApiClient';

import { renderWithRouter } from '../../helpers/renderWithRouter';

import { defined } from '../../helpers/defined';

const mocks = vi.hoisted(() => ({
  loadStepValues: vi.fn(),
  hidingFields: vi.fn(),
  appLoggerError: vi.fn(),
}));

const clients = vi.hoisted(() => ({
  patternApproval: undefined as unknown as ClientMockOf<'getAppMessageCount'>,
}));

/** Captures the inert callbacks the page hands its children, so they can be proven inert. */
const captured = vi.hoisted(() => ({
  docsProps: undefined as unknown as {
    onUploadAttachment: () => Promise<unknown>;
    attachment: { onUploadFiles: () => Promise<unknown> };
  },
  selectTab: undefined as unknown as (key: string | null) => void,
}));

vi.mock(import('@azure/msal-react'), async () => {
  const { msalReactModuleMock } = await import('../../helpers/mockMsal');

  return msalReactModuleMock() satisfies __ExactMockModule<__TestMockModule2>;
});

vi.mock(
  import('../../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const { createClientMockFor, webApiClientModuleMock } =
      await import('../../helpers/mockApiClient');
    const original = await importOriginal<typeof WebApiClient>();

    clients.patternApproval = createClientMockFor('getAppMessageCount');

    return webApiClientModuleMock(original, {
      RequestForPatternApprovalClient: clients.patternApproval,
    }) satisfies __ExactMockModule<__TestMockModule4>;
  },
);

vi.mock(
  import('../../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['api://ta/.default'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { error: mocks.appLoggerError, info: vi.fn(), verbose: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/manage/appDetailsProps'),
  () =>
    ({
      default: () => ({
        loadStepValues: mocks.loadStepValues,
        hidingFields: mocks.hidingFields,
      }),
    }) satisfies __ExactMockModule<__TestMockModule126>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Accordion'),
  () =>
    ({
      CustomAccordion: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
      ),
      CustomAccordionBody: ({
        name,
        nameRHS,
        children,
      }: {
        name: string;
        nameRHS?: ReactNode;
        children: ReactNode;
      }) => (
        <section aria-label={name}>
          <h3>{name}</h3>
          {nameRHS}
          {children}
        </section>
      ),
    }) satisfies __ExactMockModule<__TestMockModule74>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Breadcrumb'),
  () =>
    ({
      default: ({ breadcrumbs }: { breadcrumbs: { text: string }[] }) => (
        <nav data-testid='breadcrumb'>
          {breadcrumbs.map((b) => b.text).join(' / ')}
        </nav>
      ),
    }) satisfies __ExactMockModule<__TestMockModule115>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Pill/StatusPill'),
  () =>
    ({
      default: ({ status }: { status: string }) => (
        <span data-testid='status-pill'>{status}</span>
      ),
    }) satisfies __ExactMockModule<__TestMockModule122>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Buttons/BackToDashboardButton'),
  () =>
    ({
      default: () => <a href='/dashboard'>Back to dashboard</a>,
    }) satisfies __ExactMockModule<__TestMockModule127>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/summary/OrganisationSummary'),
  () =>
    ({
      default: () => <div data-testid='organisation-and-contact' />,
    }) satisfies __ExactMockModule<__TestMockModule128>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/summary/ApplicationSummary'),
  () =>
    ({
      default: () => <div data-testid='application-and-instrument' />,
    }) satisfies __ExactMockModule<__TestMockModule129>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/rhfSupportingDocuments'),
  () =>
    ({
      default: (props: typeof captured.docsProps) => {
        captured.docsProps = props;

        return <div data-testid='supporting-documents' />;
      },
    }) satisfies __ExactMockModule<__TestMockModule130>,
);

// Everything real except a hook onto Tab.Container's onSelect, so the guard that rejects an unknown
// tab key can be exercised. React-Bootstrap only ever hands it the keys its own Nav.Links carry.
vi.mock(import('react-bootstrap'), async (importOriginal) => {
  const actual = await importOriginal<typeof ReactBootstrap>();
  const RealContainer = actual.Tab.Container;

  const Container = (props: ComponentProps<typeof RealContainer>) => {
    captured.selectTab = props.onSelect as (key: string | null) => void;

    return <RealContainer {...props} />;
  };

  // Tab is a component with statics, so its members are copied rather than spread.
  return {
    ...actual,
    Tab: Object.assign({}, actual.Tab, { Container }),
  } satisfies __ExactMockModule<__TestMockModule49>;
});

vi.mock(
  import('../../../../ClientApp/src/routes/ta/manage/appDocuments'),
  () =>
    ({
      default: () => <div data-testid='application-documents' />,
    }) satisfies __ExactMockModule<__TestMockModule124>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/manage/appMessages'),
  () =>
    ({
      default: () => <div data-testid='application-messages' />,
    }) satisfies __ExactMockModule<__TestMockModule125>,
);

const auDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const applicationDetails = (overrides: Record<string, unknown> = {}) => ({
  referenceId: 'PA-001',
  title: 'Balance pattern approval',
  patternApprovalType: 'New certificate',
  status: 'InProgress',
  statusDetail: 'With the assessor',
  assessedAs: 'Non-automatic weighing instrument',
  lastUpdated: '2026-06-11T00:00:00.000Z',
  submittedDate: '2026-06-01T00:00:00.000Z',
  messageCount: 0,
  ...overrides,
});

const stepValues = (details: Record<string, unknown> = {}) => ({
  formValues: { applicationDetails: applicationDetails(details) },
});

/**
 * The tab is read from `globalThis.location.search`, not from the router, so the query has to be on
 * the real jsdom URL. A memory router's location is invisible to this component.
 */
const renderDetails = async (search = '') => {
  const ApplicationDetails = (
    await import('../../../../ClientApp/src/routes/ta/manage/appDetails')
  ).default;

  globalThis.history.pushState({}, '', `/ta/manage/APP-1${search}`);

  const result = renderWithRouter(<ApplicationDetails />, {
    path: '/ta/manage/:id',
    initialPath: `/ta/manage/APP-1${search}`,
  });

  await act(async () => {
    await Promise.resolve();
  });

  return result;
};

describe('application details', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    mocks.loadStepValues.mockReset().mockResolvedValue(stepValues());
    mocks.hidingFields.mockReset();
    mocks.appLoggerError.mockReset();
    clients.patternApproval.setAuthToken.mockReset();
    clients.patternApproval.methods.getAppMessageCount
      .mockReset()
      .mockResolvedValue(0);

    // jsdom implements neither, and both are called on the documents shortcut.
    vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined);
    globalThis.history.pushState({}, '', '/ta/manage/APP-1');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe('loading the application', () => {
    it('renders the application title and breadcrumb once loaded', async () => {
      expect.assertions(2);
      await renderDetails();

      await waitFor(() =>
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'Balance pattern approval',
        ),
      );

      expect(screen.getByTestId('breadcrumb')).toHaveTextContent(
        'New certificate (APP-1)',
      );
    });
  });
});

describe('application details', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    mocks.loadStepValues.mockReset().mockResolvedValue(stepValues());
    mocks.hidingFields.mockReset();
    mocks.appLoggerError.mockReset();
    clients.patternApproval.setAuthToken.mockReset();
    clients.patternApproval.methods.getAppMessageCount
      .mockReset()
      .mockResolvedValue(0);

    // jsdom implements neither, and both are called on the documents shortcut.
    vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined);
    globalThis.history.pushState({}, '', '/ta/manage/APP-1');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe('loading the application', () => {
    it('falls back to a generic heading when the application has no title', async () => {
      expect.assertions(1);
      mocks.loadStepValues.mockResolvedValue(stepValues({ title: undefined }));

      await renderDetails();

      await waitFor(() =>
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'Application details',
        ),
      );
    });
  });
});
