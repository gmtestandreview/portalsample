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
  appLoggerError: vi.fn(),
}));

const clients = vi.hoisted(() => ({
  patternApproval: undefined as unknown as ClientMockOf<
    'getAppDocuments' | 'addDocuments' | 'commitAppDocuments'
  >,
  progress: undefined as unknown as ClientMockOf<
    | 'getProgressUploadId'
    | 'getProgress'
    | 'deleteProgressStatistics'
    | 'cancelFile'
  >,
}));

/** Captures the documents step's props so its callbacks can be driven directly. */
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
    disableUpload: boolean;
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
      'getAppDocuments',
      'addDocuments',
      'commitAppDocuments',
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
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { error: mocks.appLoggerError, info: vi.fn(), verbose: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/rhfSupportingDocuments'),
  () =>
    ({
      default: (props: typeof documentsStep.props) => {
        documentsStep.props = props;

        return (
          <div
            data-testid='supporting-documents'
            data-uploading={String(props.uploading)}
            data-disable-upload={String(props.disableUpload)}
            data-errors={props.externalErrors.join('|')}
          />
        );
      },
    }) satisfies __ExactMockModule<__TestMockModule130>,
);

const document1 = (overrides: Record<string, unknown> = {}) => ({
  id: 'doc-1',
  attachmentName: 'spec.pdf',
  attachmentCategory: 'Specification',
  attachmentType: 'application/pdf',
  attachmentMimeType: 'application/pdf',
  attachmentSize: 1024,
  attachmentUrl: 'https://example/spec.pdf',
  documentLocked: false,
  documentBytes: 'AAAA',
  ...overrides,
});

const appDocuments = (
  documents: unknown[],
  form: Record<string, unknown> = {},
) => ({
  form: {
    documents,
    instrumentCategory: 'Mass',
    instrumentType: 'Balance',
    ...form,
  },
});

const renderRoute = async (
  path = '/ta/manage/APP-1/documents',
  routePath = '/ta/manage/:id/documents',
) => {
  const ApplicationDocuments = (
    await import('../../../../ClientApp/src/routes/ta/manage/appDocuments')
  ).default;

  const result = renderWithRouter(<ApplicationDocuments />, {
    path: routePath,
    initialPath: path,
  });

  await act(async () => {
    await Promise.resolve();
  });

  return result;
};

const renderLoaded = async () => {
  const result = await renderRoute();
  await waitFor(() => {
    if (!screen.queryByTestId('supporting-documents')) {
      throw new Error('Supporting documents have not loaded');
    }
  });

  return result;
};

describe('application documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    mocks.appLoggerError.mockReset();
    documentsStep.props = undefined as unknown as typeof documentsStep.props;

    for (const client of [clients.patternApproval, clients.progress]) {
      client.setAuthToken.mockReset();
      for (const method of Object.values(client.methods)) {
        method.mockReset();
      }
    }

    clients.patternApproval.methods.getAppDocuments.mockResolvedValue(
      appDocuments([document1()]),
    );
    clients.patternApproval.methods.addDocuments.mockResolvedValue({
      uploadId: 'upload-1',
      form: { documents: [document1()] },
    });
    clients.patternApproval.methods.commitAppDocuments.mockResolvedValue(
      undefined,
    );
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
  describe('loading existing documents', () => {
    it('fetches the application documents with an auth token', async () => {
      expect.assertions(2);
      await renderLoaded();

      expect(clients.patternApproval.setAuthToken).toHaveBeenCalledWith(
        DEFAULT_ACCESS_TOKEN,
      );
      expect(
        clients.patternApproval.methods.getAppDocuments,
      ).toHaveBeenCalledWith('APP-1');
    });
  });
});

describe('application documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    mocks.appLoggerError.mockReset();
    documentsStep.props = undefined as unknown as typeof documentsStep.props;

    for (const client of [clients.patternApproval, clients.progress]) {
      client.setAuthToken.mockReset();
      for (const method of Object.values(client.methods)) {
        method.mockReset();
      }
    }

    clients.patternApproval.methods.getAppDocuments.mockResolvedValue(
      appDocuments([document1()]),
    );
    clients.patternApproval.methods.addDocuments.mockResolvedValue({
      uploadId: 'upload-1',
      form: { documents: [document1()] },
    });
    clients.patternApproval.methods.commitAppDocuments.mockResolvedValue(
      undefined,
    );
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
  describe('loading existing documents', () => {
    it('offers a commit when at least one document is still unlocked', async () => {
      expect.assertions(1);
      await renderLoaded();

      expect(
        screen.getByRole('button', { name: 'Commit' }),
      ).toBeInTheDocument();
    });
  });
});

describe('application documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    mocks.appLoggerError.mockReset();
    documentsStep.props = undefined as unknown as typeof documentsStep.props;

    for (const client of [clients.patternApproval, clients.progress]) {
      client.setAuthToken.mockReset();
      for (const method of Object.values(client.methods)) {
        method.mockReset();
      }
    }

    clients.patternApproval.methods.getAppDocuments.mockResolvedValue(
      appDocuments([document1()]),
    );
    clients.patternApproval.methods.addDocuments.mockResolvedValue({
      uploadId: 'upload-1',
      form: { documents: [document1()] },
    });
    clients.patternApproval.methods.commitAppDocuments.mockResolvedValue(
      undefined,
    );
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
  describe('loading existing documents', () => {
    it('offers no commit when every document is locked', async () => {
      expect.assertions(1);
      clients.patternApproval.methods.getAppDocuments.mockResolvedValue(
        appDocuments([document1({ documentLocked: true })]),
      );

      await renderLoaded();

      expect(
        screen.queryByRole('button', { name: 'Commit' }),
      ).not.toBeInTheDocument();
    });
  });
});

describe('application documents', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    mocks.appLoggerError.mockReset();
    documentsStep.props = undefined as unknown as typeof documentsStep.props;

    for (const client of [clients.patternApproval, clients.progress]) {
      client.setAuthToken.mockReset();
      for (const method of Object.values(client.methods)) {
        method.mockReset();
      }
    }

    clients.patternApproval.methods.getAppDocuments.mockResolvedValue(
      appDocuments([document1()]),
    );
    clients.patternApproval.methods.addDocuments.mockResolvedValue({
      uploadId: 'upload-1',
      form: { documents: [document1()] },
    });
    clients.patternApproval.methods.commitAppDocuments.mockResolvedValue(
      undefined,
    );
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
  describe('loading existing documents', () => {
    it('offers no commit when the application carries no documents', async () => {
      expect.assertions(1);
      // `?? false` covers a response with no documents array at all.
      clients.patternApproval.methods.getAppDocuments.mockResolvedValue({
        form: {},
      });

      await renderLoaded();

      expect(
        screen.queryByRole('button', { name: 'Commit' }),
      ).not.toBeInTheDocument();
    });
  });
});
