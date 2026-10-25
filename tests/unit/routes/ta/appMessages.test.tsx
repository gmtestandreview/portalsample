import { act, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FilterMessages } from '../../../../ClientApp/src/api/web-api-client';

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
  appLoggerError: vi.fn(),
  sanitiseHtml: vi.fn((html: string) => html),
}));

const clients = vi.hoisted(() => ({
  patternApproval: undefined as unknown as ClientMockOf<
    'getAppMessages' | 'addAppMessage'
  >,
}));

/** Captures the editor's callbacks so a submission can be driven without Slate's DOM. */
const editor = vi.hoisted(() => ({
  props: undefined as unknown as {
    onSubmit: () => void;
    value: unknown[];
    placeholder: string;
  },
  renderCount: 0,
  lastKey: null as string | null,
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
      'getAppMessages',
      'addAppMessage',
    );

    // FilterMessages must stay the real enum - the view select compares against its members.
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
  import('../../../../ClientApp/src/routes/common/helperFunctions'),
  async (importOriginal) => {
    const original = await importOriginal<Record<string, unknown>>();

    return {
      ...original,
      sanitiseHtml: mocks.sanitiseHtml,
    } satisfies __ExactMockModule<__TestMockModule9>;
  },
);

vi.mock(
  import('../../../../ClientApp/src/components/SlateEditor/SlateEditor'),
  () =>
    ({
      default: (props: typeof editor.props) => {
        editor.props = props;
        editor.renderCount += 1;

        return (
          <div
            data-testid='slate-editor'
            data-placeholder={props.placeholder}
          />
        );
      },
      serializeToHtml: (value: unknown[]) => `<p>${JSON.stringify(value)}</p>`,
    }) satisfies __ExactMockModule<__TestMockModule142>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Pagination'),
  () =>
    ({
      default: ({
        currentPage,
        totalPages,
        onPageChange,
      }: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
      }) => (
        <button
          type='button'
          data-testid='pagination'
          data-current={currentPage}
          data-total={totalPages}
          onClick={() => onPageChange(2)}
        >
          next page
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule98>,
);

vi.mock(
  import('../../../../ClientApp/src/components/PaginationHeader'),
  () =>
    ({
      default: ({
        currentPage,
        totalCount,
      }: {
        currentPage: number;
        totalCount: number;
      }) => (
        <span
          data-testid='pagination-header'
          data-current={currentPage}
          data-total-count={totalCount}
        />
      ),
    }) satisfies __ExactMockModule<__TestMockModule99>,
);

const messageItem = (overrides: Record<string, unknown> = {}) => ({
  id: 'msg-1',
  subject: 'Assessment update',
  body: '<p>Your application is progressing.</p>',
  footer: 'The NMI team',
  avatar: 'NMI',
  senderName: 'NMI Officer',
  messageSent: new Date('2026-06-11T02:00:00.000Z'),
  messageRead: true,
  ...overrides,
});

const messagesResponse = (
  items: unknown[],
  details: Record<string, unknown> = {},
) => ({
  requestForPatternApprovalMessageDetails: {
    currentPage: 1,
    totalPages: 3,
    totalCount: 25,
    items,
    ...details,
  },
});

const renderRoute = async (
  path = '/ta/manage/APP-1/messages',
  routePath = '/ta/manage/:id/messages',
) => {
  const ApplicationMessages = (
    await import('../../../../ClientApp/src/routes/ta/manage/appMessages')
  ).default;

  const result = renderWithRouter(<ApplicationMessages />, {
    path: routePath,
    initialPath: path,
  });

  await act(async () => {
    await Promise.resolve();
  });

  return result;
};

describe('application messages', { timeout: 15_000 }, () => {
  beforeEach(async () => {
    await import('../../../../ClientApp/src/api/web-api-client');

    resetMsalMock();
    mocks.appLoggerError.mockReset();
    mocks.sanitiseHtml.mockReset().mockImplementation((html: string) => html);
    editor.props = undefined as unknown as typeof editor.props;
    editor.renderCount = 0;

    clients.patternApproval.setAuthToken.mockReset();
    // Echo the requested page back, as the real endpoint does. A fixed `currentPage: 1` would
    // make the component snap straight back to page one after every page change, so paging
    // would look broken here for a reason that only exists in the mock.
    clients.patternApproval.methods.getAppMessages
      .mockReset()
      .mockImplementation((_id: string, _pageSize: number, page: number) =>
        Promise.resolve(
          messagesResponse([messageItem()], { currentPage: page }),
        ),
      );
    clients.patternApproval.methods.addAppMessage
      .mockReset()
      .mockResolvedValue(undefined);
  });
  describe('loading messages', () => {
    it('requests the first page and renders the returned message', async () => {
      expect.assertions(5);
      await renderRoute();

      await waitFor(() =>
        expect(screen.getByText('Assessment update')).toBeInTheDocument(),
      );

      expect(clients.patternApproval.setAuthToken).toHaveBeenCalledWith(
        DEFAULT_ACCESS_TOKEN,
      );
      expect(
        clients.patternApproval.methods.getAppMessages,
      ).toHaveBeenCalledWith(
        'APP-1',
        10,
        1,
        FilterMessages.ShowAllMessages,
        'APP-1',
      );
      expect(screen.getByTestId('pagination')).toHaveAttribute(
        'data-total',
        '3',
      );
      expect(screen.getByTestId('pagination-header')).toHaveAttribute(
        'data-total-count',
        '25',
      );
    });
  });
});
