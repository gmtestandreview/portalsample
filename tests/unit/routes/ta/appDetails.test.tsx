import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
  loadStepValues: vi.fn<(...args: unknown[]) => unknown>(),
  hidingFields: vi.fn<(...args: unknown[]) => unknown>(),
  appLoggerError: vi.fn<(...args: unknown[]) => unknown>(),
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

vi.mock(import('@azure/msal-react'), (async () => {
  const { msalReactModuleMock } = await import('../../helpers/mockMsal');

  return msalReactModuleMock() satisfies __ExactMockModule<__TestMockModule2>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule2>);

vi.mock(import('../../../../ClientApp/src/api/web-api-client'), (async (
  importOriginal: Parameters<__DynamicPartialMockFactory<__TestMockModule4>>[0],
) => {
  const { createClientMockFor, webApiClientModuleMock } =
    await import('../../helpers/mockApiClient');
  const original = await importOriginal<typeof WebApiClient>();

  clients.patternApproval = createClientMockFor('getAppMessageCount');

  return webApiClientModuleMock(original, {
    RequestForPatternApprovalClient: clients.patternApproval,
  }) satisfies __ExactMockModule<__TestMockModule4>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule4>);

vi.mock(
  import('../../../../ClientApp/src/authentication/authConfig'),
  (() =>
    ({
      tokenRequest: { scopes: ['api://ta/.default'] },
    }) satisfies __ExactMockModule<__TestMockModule8>) as unknown as __DynamicPartialMockFactory<__TestMockModule8>,
);

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  (() =>
    ({
      default: {
        error: mocks.appLoggerError,
        info: vi.fn<(...args: unknown[]) => unknown>(),
        verbose: vi.fn<(...args: unknown[]) => unknown>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>) as unknown as __DynamicPartialMockFactory<__TestMockModule5>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/manage/appDetailsProps'),
  (() =>
    ({
      default: () => ({
        loadStepValues: mocks.loadStepValues,
        hidingFields: mocks.hidingFields,
      }),
    }) satisfies __ExactMockModule<__TestMockModule126>) as unknown as __DynamicPartialMockFactory<__TestMockModule126>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Accordion'),
  (() =>
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
    }) satisfies __ExactMockModule<__TestMockModule74>) as unknown as __DynamicPartialMockFactory<__TestMockModule74>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Breadcrumb'),
  (() =>
    ({
      default: ({ breadcrumbs }: { breadcrumbs: { text: string }[] }) => (
        <nav data-testid='breadcrumb'>
          {breadcrumbs.map((b) => b.text).join(' / ')}
        </nav>
      ),
    }) satisfies __ExactMockModule<__TestMockModule115>) as unknown as __DynamicPartialMockFactory<__TestMockModule115>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Pill/StatusPill'),
  (() =>
    ({
      default: ({ status }: { status: string }) => (
        <span data-testid='status-pill'>{status}</span>
      ),
    }) satisfies __ExactMockModule<__TestMockModule122>) as unknown as __DynamicPartialMockFactory<__TestMockModule122>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Buttons/BackToDashboardButton'),
  (() =>
    ({
      default: () => <a href='/dashboard'>Back to dashboard</a>,
    }) satisfies __ExactMockModule<__TestMockModule127>) as unknown as __DynamicPartialMockFactory<__TestMockModule127>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/summary/OrganisationSummary'),
  (() =>
    ({
      default: () => <div data-testid='organisation-and-contact' />,
    }) satisfies __ExactMockModule<__TestMockModule128>) as unknown as __DynamicPartialMockFactory<__TestMockModule128>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/summary/ApplicationSummary'),
  (() =>
    ({
      default: () => <div data-testid='application-and-instrument' />,
    }) satisfies __ExactMockModule<__TestMockModule129>) as unknown as __DynamicPartialMockFactory<__TestMockModule129>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/rhfSupportingDocuments'),
  (() =>
    ({
      default: (props: typeof captured.docsProps) => {
        captured.docsProps = props;

        return <div data-testid='supporting-documents' />;
      },
    }) satisfies __ExactMockModule<__TestMockModule130>) as unknown as __DynamicPartialMockFactory<__TestMockModule130>,
);

// Everything real except a hook onto Tab.Container's onSelect, so the guard that rejects an unknown
// tab key can be exercised. React-Bootstrap only ever hands it the keys its own Nav.Links carry.
vi.mock(import('react-bootstrap'), (async (
  importOriginal: Parameters<
    __DynamicPartialMockFactory<__TestMockModule49>
  >[0],
) => {
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
}) as unknown as __DynamicPartialMockFactory<__TestMockModule49>);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/manage/appDocuments'),
  (() =>
    ({
      default: () => <div data-testid='application-documents' />,
    }) satisfies __ExactMockModule<__TestMockModule124>) as unknown as __DynamicPartialMockFactory<__TestMockModule124>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/manage/appMessages'),
  (() =>
    ({
      default: () => <div data-testid='application-messages' />,
    }) satisfies __ExactMockModule<__TestMockModule125>) as unknown as __DynamicPartialMockFactory<__TestMockModule125>,
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
  const resetApplicationDetailsState = async () => {
    vi.restoreAllMocks();
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
  };

  describe('loading the application', () => {
    it('renders the application title and breadcrumb once loaded', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      await renderDetails();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'Balance pattern approval',
        );
      });

      expect(screen.getByTestId('breadcrumb')).toHaveTextContent(
        'New certificate (APP-1)',
      );
    });

    it('falls back to a generic heading when the application has no title', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      mocks.loadStepValues.mockResolvedValue(stepValues({ title: undefined }));

      await renderDetails();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'Application details',
        );
      });
    });

    it('shows the status, dates and assessment on the details tab', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      await renderDetails();

      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Non-automatic weighing instrument'),
      ).toBeInTheDocument();
      // Formatted for en-AU rather than shown as raw ISO. The expected string is derived the
      // same way the component derives it, because the result is timezone-dependent and
      // hard-coding it would make this a tripwire in any zone but the author's.
      expect(
        screen.getByText(auDate('2026-06-11T00:00:00.000Z')),
      ).toBeInTheDocument();
      expect(
        screen.getByText(auDate('2026-06-01T00:00:00.000Z')),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('2026-06-11T00:00:00.000Z'),
      ).not.toBeInTheDocument();
    });

    it('leaves the date blank when the application has none', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      mocks.loadStepValues.mockResolvedValue(
        stepValues({ lastUpdated: undefined, submittedDate: undefined }),
      );

      await renderDetails();

      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      expect(
        screen.queryByText(auDate('2026-06-11T00:00:00.000Z')),
      ).not.toBeInTheDocument();
    });

    it('records no application type when the response omits one', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      mocks.loadStepValues.mockResolvedValue(
        stepValues({ patternApprovalType: undefined }),
      );

      await renderDetails();

      await waitFor(() => {
        expect(screen.getByTestId('breadcrumb')).toHaveTextContent('(APP-1)');
      });
    });
  });

  describe('the unread message count', () => {
    it('polls the count and shows it as a badge', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      clients.patternApproval.methods.getAppMessageCount.mockResolvedValue(4);

      await renderDetails();

      await waitFor(() => {
        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledWith('APP-1', 'APP-1');
      });

      expect(clients.patternApproval.setAuthToken).toHaveBeenCalledWith(
        DEFAULT_ACCESS_TOKEN,
      );

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    it('shows no badge when nothing is unread', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      await renderDetails();

      await waitFor(() => {
        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledWith('APP-1', 'APP-1');
      });

      expect(
        screen.getByRole('button', { name: /Messages/ }),
      ).toBeInTheDocument();
      expect(screen.queryByText('unread')).not.toBeInTheDocument();
    });

    it('polls again after the refresh interval', async () => {
      expect.hasAssertions();

      vi.useFakeTimers();
      try {
        await resetApplicationDetailsState();
        await renderDetails();

        await act(async () => {
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledTimes(1);

        await act(async () => {
          vi.advanceTimersByTime(5000);
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('clears a scheduled poll when the page unmounts', async () => {
      expect.hasAssertions();

      vi.useFakeTimers();
      try {
        await resetApplicationDetailsState();
        const { unmount } = await renderDetails();

        await act(async () => {
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledTimes(1);

        unmount();

        await act(async () => {
          vi.advanceTimersByTime(5000);
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('ignores an old poll after the application id changes mid-request', async () => {
      expect.hasAssertions();

      vi.useFakeTimers();
      try {
        await resetApplicationDetailsState();

        let releaseOldPoll: (value: number) => void = () => undefined;
        clients.patternApproval.methods.getAppMessageCount.mockImplementation(
          (applicationId: unknown) => {
            if (applicationId === 'APP-1') {
              return new Promise<number>((resolve) => {
                releaseOldPoll = resolve;
              });
            }
            return Promise.resolve(9);
          },
        );

        const { router } = await renderDetails();

        await act(async () => {
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledWith('APP-1', 'APP-1');

        await act(async () => {
          await router.navigate('/ta/manage/APP-2');
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledWith('APP-2', 'APP-2');

        act(() => {
          releaseOldPoll(4);
        });
        await act(async () => {
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
          vi.advanceTimersByTime(5000);
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledTimes(3);
        expect(screen.getByText('9')).toBeInTheDocument();
        expect(screen.queryByText('4')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('treats a missing count as zero', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      clients.patternApproval.methods.getAppMessageCount.mockResolvedValue(
        undefined,
      );

      await renderDetails();

      await waitFor(() => {
        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledWith('APP-1', 'APP-1');
      });

      expect(screen.queryByText('unread')).not.toBeInTheDocument();
    });

    it('swallows a failed count rather than breaking the page', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      clients.patternApproval.methods.getAppMessageCount.mockRejectedValue(
        new Error('count down'),
      );

      await renderDetails();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('does not poll without a signed-in account', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      signOut();

      await renderDetails();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      expect(
        clients.patternApproval.methods.getAppMessageCount,
      ).not.toHaveBeenCalled();
    });

    it('does not poll without an application id', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const ApplicationDetails = (
        await import('../../../../ClientApp/src/routes/ta/manage/appDetails')
      ).default;

      renderWithRouter(<ApplicationDetails />, {
        path: '/ta/manage',
        initialPath: '/ta/manage',
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(
        clients.patternApproval.methods.getAppMessageCount,
      ).not.toHaveBeenCalled();
    });

    it('stops polling once the page is unmounted', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const { unmount } = await renderDetails();

      await waitFor(() => {
        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledWith('APP-1', 'APP-1');
      });
      const callsAtUnmount =
        clients.patternApproval.methods.getAppMessageCount.mock.calls.length;

      unmount();
      await act(async () => {
        await Promise.resolve();
      });

      expect(
        clients.patternApproval.methods.getAppMessageCount,
      ).toHaveBeenCalledTimes(callsAtUnmount);
    });
  });

  describe('choosing a tab', () => {
    it('opens on the details tab by default', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      await renderDetails();

      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      // Messages mount lazily, so nothing is there until the tab is opened.
      expect(
        screen.queryByTestId('application-messages'),
      ).not.toBeInTheDocument();
    });

    it('opens straight onto messages when the url asks for it', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      await renderDetails('?tab=messages');

      await waitFor(() => {
        expect(screen.getByTestId('application-messages')).toBeInTheDocument();
      });
    });

    it('ignores a tab the page does not have', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      await renderDetails('?tab=nonsense');

      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('application-messages'),
      ).not.toBeInTheDocument();
    });

    it('mounts messages and records the tab in the url when selected', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const user = userEvent.setup();
      await renderDetails();
      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: 'Messages' }));

      await waitFor(() => {
        expect(screen.getByTestId('application-messages')).toBeInTheDocument();
      });

      expect(globalThis.location.search).toContain('tab=messages');
    });

    it('follows the messages shortcut on the status panel', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const user = userEvent.setup();
      await renderDetails();
      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Messages/ }));

      await waitFor(() => {
        expect(screen.getByTestId('application-messages')).toBeInTheDocument();
      });
    });

    it('jumps to the documents tab from the supporting documents shortcut', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const user = userEvent.setup();
      await renderDetails();
      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'View documents' }));

      await waitFor(() => {
        expect(globalThis.location.search).toContain('tab=documents');
      });

      expect(globalThis.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('jumps to the documents tab from the keyboard', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const user = userEvent.setup();
      await renderDetails();
      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      const shortcut = screen.getByRole('button', { name: 'View documents' });
      shortcut.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(globalThis.location.search).toContain('tab=documents');
      });
    });

    it('also takes the space bar on the documents shortcut', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const user = userEvent.setup();
      await renderDetails();
      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      const shortcut = screen.getByRole('button', { name: 'View documents' });
      shortcut.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(globalThis.location.search).toContain('tab=documents');
      });
    });

    it('ignores other keys on the documents shortcut', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const user = userEvent.setup();
      await renderDetails();
      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      const shortcut = screen.getByRole('button', { name: 'View documents' });
      shortcut.focus();
      await user.keyboard('{Escape}');

      expect(globalThis.location.search).not.toContain('tab=documents');
    });

    it('follows the browser back button between tabs', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const user = userEvent.setup();
      await renderDetails();
      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: 'Messages' }));
      await waitFor(() => {
        expect(screen.getByTestId('application-messages')).toBeInTheDocument();
      });

      // Rewind the url the way a back navigation does, then announce it.
      act(() => {
        globalThis.history.pushState({}, '', '/ta/manage/APP-1?tab=details');
        globalThis.dispatchEvent(new PopStateEvent('popstate'));
      });

      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });
    });
  });

  describe('when the application will not load', () => {
    it('logs the failure and stops the spinner instead of hanging on it', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      mocks.loadStepValues.mockRejectedValue(new Error('details unavailable'));

      await renderDetails();

      await waitFor(() => {
        expect(mocks.appLoggerError).toHaveBeenCalledWith(
          'Failed to load application details',
          expect.any(Error),
          { Id: 'APP-1' },
        );
      });

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('copes with a response that carries no application details', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      mocks.loadStepValues.mockResolvedValue({ formValues: {} });

      await renderDetails();

      // No type recorded, and the details panel renders from an empty set rather than
      // throwing on the way in.
      await waitFor(() => {
        expect(screen.getByTestId('breadcrumb')).toHaveTextContent('(APP-1)');
      });

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('shows the details spinner while switching to another application', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const { router } = await renderDetails();
      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      let release: (value: unknown) => void = () => undefined;
      mocks.loadStepValues.mockReturnValue(
        new Promise((resolve) => {
          release = resolve;
        }),
      );

      // A second load with details already on screen is the only way the panel's own spinner
      // is reached - the first load happens while there is nothing to show yet.
      await act(async () => {
        await router.navigate('/ta/manage/APP-2');
      });

      // Both the details and timeline panes carry this spinner, and react-bootstrap keeps
      // inactive panes mounted, so more than one is on the page.
      expect(screen.getAllByText('Loading data...').length).toBeGreaterThan(0);

      act(() => {
        release(stepValues());
      });
    });
  });

  describe('guards and inert wiring', () => {
    it('ignores a tab key the page does not know', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      await renderDetails();
      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      act(() => {
        captured.selectTab('not-a-tab');
      });
      act(() => {
        captured.selectTab(null);
      });

      // Still on details, and nothing written to the url.
      expect(screen.getByText('With the assessor')).toBeInTheDocument();
      expect(globalThis.location.search).not.toContain('not-a-tab');
    });

    it('forces a refresh when the messages tab is chosen again', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const user = userEvent.setup();
      await renderDetails();
      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      const messagesTab = screen.getByRole('tab', { name: 'Messages' });
      await user.click(messagesTab);
      await waitFor(() => {
        expect(screen.getByTestId('application-messages')).toBeInTheDocument();
      });

      // Clicking the tab you are already on remounts the list rather than doing nothing.
      await user.click(messagesTab);

      await waitFor(() => {
        expect(screen.getByTestId('application-messages')).toBeInTheDocument();
      });
    });

    it('leaves messages unmounted when another tab is chosen', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const user = userEvent.setup();
      await renderDetails();
      await waitFor(() => {
        expect(screen.getByText('With the assessor')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: 'Documents' }));

      await waitFor(() => {
        expect(globalThis.location.search).toContain('tab=documents');
      });

      expect(
        screen.queryByTestId('application-messages'),
      ).not.toBeInTheDocument();
    });

    it('drops a message count that arrives after the page is gone', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      let releaseCount: (value: number) => void = () => undefined;
      clients.patternApproval.methods.getAppMessageCount.mockReturnValue(
        new Promise<number>((resolve) => {
          releaseCount = resolve;
        }),
      );

      const { unmount } = await renderDetails();
      await waitFor(() => {
        expect(
          clients.patternApproval.methods.getAppMessageCount,
        ).toHaveBeenCalledWith('APP-1', 'APP-1');
      });

      unmount();
      act(() => {
        releaseCount(7);
      });

      // Resolving into a disposed page must neither set state nor schedule the next poll.
      const callsAfterUnmount =
        clients.patternApproval.methods.getAppMessageCount.mock.calls.length;
      await act(async () => {
        await Promise.resolve();
      });

      expect(
        clients.patternApproval.methods.getAppMessageCount,
      ).toHaveBeenCalledTimes(callsAfterUnmount);
    });

    it('hands the summary an upload pair that does nothing', async () => {
      // The details page shows documents read-only, so both upload hooks are deliberate
      // no-ops. Pinning them means a change that starts relying on either one fails here.
      expect.hasAssertions();

      await resetApplicationDetailsState();

      await renderDetails();
      await waitFor(() => {
        expect(screen.getByTestId('supporting-documents')).toBeInTheDocument();
      });

      await expect(
        captured.docsProps.onUploadAttachment(),
      ).resolves.toStrictEqual([]);
      await expect(
        captured.docsProps.attachment.onUploadFiles(),
      ).resolves.toStrictEqual([]);
    });
  });

  describe('the summary accordions', () => {
    it('still renders the summaries when the page props carry no hiding rules', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      const original = mocks.hidingFields;
      Object.assign(mocks, { hidingFields: undefined });

      try {
        await renderDetails();

        await waitFor(() => {
          expect(
            screen.getByTestId('organisation-and-contact'),
          ).toBeInTheDocument();
        });
      } finally {
        Object.assign(mocks, { hidingFields: original });
      }
    });

    it('embeds the organisation, application and document summaries', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      await renderDetails();

      await waitFor(() => {
        expect(
          screen.getByTestId('organisation-and-contact'),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('application-and-instrument'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('supporting-documents')).toBeInTheDocument();
    });

    it('shows the application status pill', async () => {
      expect.hasAssertions();

      await resetApplicationDetailsState();

      await renderDetails();

      await waitFor(() => {
        expect(screen.getAllByTestId('status-pill').length).toBeGreaterThan(0);
      });

      expect(
        within(defined(screen.getAllByTestId('status-pill')[0])).getByText(
          'InProgress',
        ),
      ).toBeInTheDocument();
    });
  });
});
