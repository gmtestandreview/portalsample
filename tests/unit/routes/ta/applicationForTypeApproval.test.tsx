import { act, screen, waitFor } from '@testing-library/react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AttachmentDto,
  FileParameter,
} from '../../../../ClientApp/src/api/web-api-client';

import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';

import { resetMsalMock, DEFAULT_ACCESS_TOKEN } from '../../helpers/mockMsal';

import type { ClientMockOf } from '../../helpers/mockApiClient';

import { renderWithRouter } from '../../helpers/renderWithRouter';

const mocks = vi.hoisted(() => ({
  accountContext: vi.fn(),
  appLoggerError: vi.fn(),
}));

const clients = vi.hoisted(() => ({
  patternApproval: undefined as unknown as ClientMockOf<
    'getStepStatuses' | 'addDocuments'
  >,
  progress: undefined as unknown as ClientMockOf<
    | 'getProgressUploadId'
    | 'getProgress'
    | 'deleteProgressStatistics'
    | 'cancelFile'
  >,
}));

/** Captures the props the wizard hands to the documents step, so its callbacks can be driven. */
const documentsStep = vi.hoisted(() => ({
  props: undefined as unknown as {
    onUploadAttachment: (
      token: string,
      files: FileParameter[],
    ) => Promise<AttachmentDto[]>;
    handleCancelFile: (fileName: string) => Promise<void>;
    attachment: { onUploadFiles: () => Promise<unknown[]> };
    progress?: { percent?: number; status?: string };
    uploading: boolean;
    externalErrors: string[];
  },
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

    clients.patternApproval = createClientMockFor(
      'getStepStatuses',
      'addDocuments',
    );
    clients.progress = createClientMockFor(
      'getProgressUploadId',
      'getProgress',
      'deleteProgressStatistics',
      'cancelFile',
    );

    return webApiClientModuleMock(original, {
      RequestForPatternApprovalClient: clients.patternApproval,
      ProgressClient: clients.progress,
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
  import('../../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      default: () => mocks.accountContext(),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { error: mocks.appLoggerError, info: vi.fn(), verbose: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('../../../../ClientApp/src/components/forms/WizardForm'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <section data-testid='wizard-form'>{children}</section>
      ),
    }) satisfies __ExactMockModule<__TestMockModule60>,
);

vi.mock(
  import('../../../../ClientApp/src/components/forms/WizardForm/WizardStep'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <article data-testid='wizard-step'>{children}</article>
      ),
    }) satisfies __ExactMockModule<__TestMockModule24>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/organisationAndContact'),
  () =>
    ({
      default: () => <div>Organisation and contact step</div>,
    }) satisfies __ExactMockModule<__TestMockModule138>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/applicationAndInstrument'),
  () =>
    ({
      default: () => <div>Application and instrument step</div>,
    }) satisfies __ExactMockModule<__TestMockModule139>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/summaryAndSubmit'),
  () =>
    ({
      default: () => <div>Summary and submit step</div>,
    }) satisfies __ExactMockModule<__TestMockModule140>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/supportingDocuments'),
  () =>
    ({
      default: (props: typeof documentsStep.props) => {
        documentsStep.props = props;

        return (
          <div
            data-testid='supporting-documents'
            data-uploading={String(props.uploading)}
            data-percent={props.progress?.percent ?? ''}
            data-errors={props.externalErrors.join('|')}
          />
        );
      },
    }) satisfies __ExactMockModule<__TestMockModule141>,
);

const statuses = [{ name: 'Organisation and contact', status: 'current' }];

const renderRoute = async (path = '/ta/APP-1') => {
  const ApplicationForTypeApproval = (
    await import('../../../../ClientApp/src/routes/ta')
  ).default;

  const result = renderWithRouter(<ApplicationForTypeApproval />, {
    path: '/ta/:id',
    initialPath: path,
  });

  await act(async () => {
    await Promise.resolve();
  });

  return result;
};

/** Renders and waits for the wizard, which is the precondition for every handler test. */
const renderLoadedWizard = async () => {
  const result = await renderRoute();
  await waitFor(() => {
    if (!screen.queryByTestId('wizard-form')) {
      throw new Error('Wizard form has not loaded');
    }
  });

  return result;
};

describe('application for type approval', () => {
  beforeEach(async () => {
    // vi.mock factories are lazy: they run when the mocked module is first imported. This file
    // imports web-api-client for types only, and those are erased at compile time, so without
    // this the factory has not run yet and `clients` is still undefined here.
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    mocks.accountContext.mockReset().mockReturnValue({
      details: { userProfile: { email: 'tester@example.gov.au' } },
    });
    mocks.appLoggerError.mockReset();
    documentsStep.props = undefined as unknown as typeof documentsStep.props;

    for (const client of [clients.patternApproval, clients.progress]) {
      client.setAuthToken.mockReset();
      for (const method of Object.values(client.methods)) {
        method.mockReset();
      }
    }

    clients.patternApproval.methods.getStepStatuses.mockResolvedValue(statuses);
    clients.patternApproval.methods.addDocuments.mockResolvedValue({
      uploadId: 'upload-1',
      form: { documents: [] },
    });
    clients.progress.methods.getProgressUploadId.mockResolvedValue('upload-1');
    clients.progress.methods.getProgress.mockResolvedValue({
      percent: 100,
      status: 'Completed',
    });
    clients.progress.methods.deleteProgressStatistics.mockResolvedValue(
      undefined,
    );
    clients.progress.methods.cancelFile.mockResolvedValue(undefined);
  });
  describe('loading the wizard', () => {
    it('renders every step once the statuses arrive', async () => {
      expect.assertions(5);
      await renderLoadedWizard();

      expect(clients.patternApproval.setAuthToken).toHaveBeenCalledWith(
        DEFAULT_ACCESS_TOKEN,
      );
      expect(
        clients.patternApproval.methods.getStepStatuses,
      ).toHaveBeenCalledWith('APP-1');
      expect(screen.getAllByTestId('wizard-step')).toHaveLength(4);
      expect(
        screen.getByText('Organisation and contact step'),
      ).toBeInTheDocument();
      expect(screen.getByText('Summary and submit step')).toBeInTheDocument();
    });
  });
});
