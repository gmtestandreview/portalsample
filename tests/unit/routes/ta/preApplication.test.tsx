import { screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  msalInstance,
  resetMsalMock,
  testAccount,
} from '../../helpers/mockMsal';

import { renderWithRouter } from '../../helpers/renderWithRouter';

const mocks = vi.hoisted(() => ({
  downloadFileFromUrl: vi.fn(),
}));

vi.mock(import('@azure/msal-react'), async () => {
  const { msalReactModuleMock } = await import('../../helpers/mockMsal');

  return msalReactModuleMock() satisfies __ExactMockModule<__TestMockModule2>;
});

vi.mock(
  import('../../../../ClientApp/src/routes/common/helperFunctions'),
  async (importOriginal) => {
    const original = await importOriginal<Record<string, unknown>>();

    return {
      ...original,
      downloadFileFromUrl: mocks.downloadFileFromUrl,
    } satisfies __ExactMockModule<__TestMockModule9>;
  },
);

const renderPage = async () => {
  const PreApplication = (
    await import('../../../../ClientApp/src/routes/ta/preApplication')
  ).default;

  return renderWithRouter(<PreApplication />, {
    path: '/ta/pre-application',
    initialPath: '/ta/pre-application',
    extraRoutes: [
      { path: '/dashboard-ta', element: <div data-testid='dashboard-ta' /> },
      {
        path: '/ta/type-approval-create',
        element: <div data-testid='create-application' />,
      },
    ],
  });
};

describe('pattern approval pre-application', () => {
  beforeEach(() => {
    resetMsalMock();
    mocks.downloadFileFromUrl.mockReset();
  });
  it('explains what the applicant needs before starting', async () => {
    expect.assertions(3);
    await renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Pattern/type approval',
    );
    expect(
      screen.getByText('test results, certificates or reports'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('info-summary')).toHaveTextContent(
      'New customers',
    );
  });
});

describe('pattern approval pre-application', () => {
  beforeEach(() => {
    resetMsalMock();
    mocks.downloadFileFromUrl.mockReset();
  });
  it('links out to the certification procedures', async () => {
    expect.assertions(2);
    await renderPage();

    expect(screen.getByRole('link', { name: /NMI P 106/ })).toHaveAttribute(
      'href',
      'https://www.industry.gov.au/sites/default/files/2026-03/nmi-p-106.pdf',
    );
    expect(
      screen.getByRole('link', { name: /Pattern approval checklist/ }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining('pattern-approval-requirements'),
    );
  });
});
