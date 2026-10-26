import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { DashboardTab } from '../../../../ClientApp/src/components/SearchFilter/types';
import RequestForPatternApprovalCreated from '../../../../ClientApp/src/routes/ta/created';

const mocks = vi.hoisted(() => ({
  useHtmlTitle: vi.fn<(...args: unknown[]) => unknown>(),
  useBodyClass: vi.fn<(...args: unknown[]) => unknown>(),
  account: {
    details: {
      organisation: 'National Measurement Institute',
      trading: 'Trading',
      branch: 'Branch',
    },
  },
}));

vi.mock(
  import('../../../../ClientApp/src/authentication/hooks'),
  (() =>
    ({
      default: () => mocks.account,
    }) satisfies __ExactMockModule<__TestMockModule26>) as unknown as __DynamicPartialMockFactory<__TestMockModule26>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Utilities/useHtmlTitle'),
  (() =>
    ({
      default: mocks.useHtmlTitle,
    }) satisfies __ExactMockModule<__TestMockModule89>) as unknown as __DynamicPartialMockFactory<__TestMockModule89>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Utilities/useBodyClass'),
  (() =>
    ({
      default: mocks.useBodyClass,
    }) satisfies __ExactMockModule<__TestMockModule59>) as unknown as __DynamicPartialMockFactory<__TestMockModule59>,
);

vi.mock(
  import('../../../../ClientApp/src/components/forms/FormBanner'),
  (() =>
    ({
      default: ({
        title,
        refTitle,
        subTitle,
      }: {
        title: string;
        refTitle: string;
        subTitle: string;
      }) => (
        <div data-testid='form-banner'>
          <span>{title}</span>
          <span>{refTitle}</span>
          <span>{subTitle}</span>
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule90>) as unknown as __DynamicPartialMockFactory<__TestMockModule90>,
);

const renderCreatedRoute = () =>
  render(
    <MemoryRouter initialEntries={['/ta/PA-200/created']}>
      <Routes>
        <Route
          path='/ta/:id/created'
          element={<RequestForPatternApprovalCreated />}
        />
        <Route
          path='/dashboard-ta'
          element={<div>Pattern approval dashboard</div>}
        />
      </Routes>
    </MemoryRouter>,
  );

const expectDashboardTabStorage = () => {
  expect(globalThis.sessionStorage.getItem('set-tabop-after-save')).toBe(
    JSON.stringify(DashboardTab.Requests),
  );
};

describe(RequestForPatternApprovalCreated, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.sessionStorage.clear();
  });

  it('renders the submitted reference and page chrome metadata', () => {
    expect.hasAssertions();

    renderCreatedRoute();

    expect({
      titleCall: mocks.useHtmlTitle.mock.calls,
      bodyClassCall: mocks.useBodyClass.mock.calls,
      banner: screen.getByTestId('form-banner').textContent,
      heading: screen.getByRole('heading', {
        name: 'Your application has been submitted',
      }).textContent,
      success: screen.getByTestId('application-submit-success').textContent,
    }).toEqual({
      titleCall: [
        [
          'Application for Pattern/type approval created successfully | NMI Services portal',
        ],
      ],
      bodyClassCall: [['application-created']],
      banner: expect.stringContaining('Pattern/type approval - Application'),
      heading: 'Your application has been submitted',
      success: expect.stringContaining('PA-200'),
    });
  });

  it('sets the dashboard tab marker and navigates when the dashboard button is clicked', () => {
    expect.hasAssertions();

    renderCreatedRoute();

    fireEvent.click(screen.getByTestId('go-to-dashboard-button'));

    expectDashboardTabStorage();

    expect(screen.getByText('Pattern approval dashboard')).toBeInTheDocument();
  });

  it('sets the dashboard tab marker when the dashboard text link is followed', () => {
    expect.hasAssertions();

    renderCreatedRoute();

    fireEvent.click(screen.getByRole('link', { name: 'dashboard' }));

    expectDashboardTabStorage();

    expect(screen.getByText('Pattern approval dashboard')).toBeInTheDocument();
  });
});
