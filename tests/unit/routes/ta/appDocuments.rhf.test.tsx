import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';

import { resetMsalMock } from '../../helpers/mockMsal';
import type { ClientMockOf } from '../../helpers/mockApiClient';
import { renderWithRouter } from '../../helpers/renderWithRouter';
import { defined } from '../../helpers/defined';
import { ValidationMessages } from '../../../../ClientApp/src/routes/ta/types';

const mocks = vi.hoisted(() => ({
  appLoggerError: vi.fn(),
}));

const clients = vi.hoisted(() => ({
  patternApproval: undefined as unknown as ClientMockOf<
    'getAppDocuments' | 'addDocuments' | 'commitAppDocuments' | 'updateCategory'
  >,
  progress: undefined as unknown as ClientMockOf<
    | 'getProgressUploadId'
    | 'getProgress'
    | 'deleteProgressStatistics'
    | 'cancelFile'
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
      'getAppDocuments',
      'addDocuments',
      'commitAppDocuments',
      'updateCategory'
    );
    clients.progress = createClientMockFor(
      'getProgressUploadId',
      'getProgress',
      'deleteProgressStatistics',
      'cancelFile'
    );

    return webApiClientModuleMock(original, {
      RequestForPatternApprovalClient: clients.patternApproval,
      ProgressClient: clients.progress,
    });
  }
);

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
  tokenRequest: { scopes: ['api://ta/.default'] },
}));

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
  default: { error: mocks.appLoggerError, info: vi.fn(), verbose: vi.fn() },
}));

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
  form: Record<string, unknown> = {}
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
  routePath = '/ta/manage/:id/documents'
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

const renderLoaded = async (documents: unknown[]) => {
  clients.patternApproval.methods.getAppDocuments.mockResolvedValue(
    appDocuments(documents)
  );
  const result = await renderRoute();
  await screen.findByRole('heading', { name: 'Documents' });
  return result;
};

describe('application documents with the real RHF form', () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    mocks.appLoggerError.mockReset();

    for (const client of [clients.patternApproval, clients.progress]) {
      client.setAuthToken.mockReset();
      for (const method of Object.values(client.methods)) {
        method.mockReset();
      }
    }
    clients.patternApproval.methods.commitAppDocuments.mockResolvedValue(
      undefined
    );
    clients.patternApproval.methods.updateCategory.mockResolvedValue(undefined);
  });

  it('commits the documents without their bytes and leaves the form data intact', async () => {
    const user = userEvent.setup();
    await renderLoaded([document1()]);

    await user.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() =>
      expect(
        clients.patternApproval.methods.commitAppDocuments
      ).toHaveBeenCalled()
    );
    const [applicationId, values] = defined(
      clients.patternApproval.methods.commitAppDocuments.mock.calls[0]
    );
    expect(applicationId).toBe('APP-1');
    expect(values.form.documents[0].documentBytes).toBeUndefined();
    expect(values.form.documents[0].attachmentName).toBe('spec.pdf');
    expect(values.form.instrumentCategory).toBe('Mass');
  });

  it('blocks the commit and asks for a category while a document has none', async () => {
    const user = userEvent.setup();
    await renderLoaded([document1({ attachmentCategory: '' })]);

    await user.click(screen.getByRole('button', { name: 'Commit' }));

    expect(
      await screen.findByText(ValidationMessages.RequiredTag, {
        selector: 'li',
      })
    ).toBeInTheDocument();
    expect(
      clients.patternApproval.methods.commitAppDocuments
    ).not.toHaveBeenCalled();
  });

  it('commits once a category has been chosen', async () => {
    const user = userEvent.setup();
    await renderLoaded([document1({ attachmentCategory: '' })]);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Category' }),
      'Certificate'
    );
    expect(clients.patternApproval.methods.updateCategory).toHaveBeenCalledWith(
      'APP-1',
      'doc-1',
      'Certificate'
    );
    await user.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() =>
      expect(
        clients.patternApproval.methods.commitAppDocuments
      ).toHaveBeenCalled()
    );
    const [, values] = defined(
      clients.patternApproval.methods.commitAppDocuments.mock.calls[0]
    );
    expect(values.form.documents[0].attachmentCategory).toBe('Certificate');
  });

  it('shows the saved documents as rows with their category', async () => {
    await renderLoaded([document1({ attachmentCategory: 'Certificate' })]);

    const row = screen.getByText('spec.pdf').closest('.attachment');
    expect(row).not.toBeNull();
    expect(
      within(row as HTMLElement).getByRole('combobox', { name: 'Category' })
    ).toHaveValue('Certificate');
  });
});
