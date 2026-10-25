import { render, screen } from '@testing-library/react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryRouter, Route, Routes } from 'react-router';

import RequestForPatternApprovalCreated from '../../../../ClientApp/src/routes/ta/created';

const mocks = vi.hoisted(() => ({
  useHtmlTitle: vi.fn(),
  useBodyClass: vi.fn(),
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
  () =>
    ({
      default: () => mocks.account,
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Utilities/useHtmlTitle'),
  () =>
    ({
      default: mocks.useHtmlTitle,
    }) satisfies __ExactMockModule<__TestMockModule89>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Utilities/useBodyClass'),
  () =>
    ({
      default: mocks.useBodyClass,
    }) satisfies __ExactMockModule<__TestMockModule59>,
);

vi.mock(
  import('../../../../ClientApp/src/components/forms/FormBanner'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule90>,
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

describe(RequestForPatternApprovalCreated, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.sessionStorage.clear();
  });
  it('renders the submitted reference and page chrome metadata', () => {
    expect.assertions(1);
    renderCreatedRoute();
    expect(mocks.useHtmlTitle).toHaveBeenCalledWith(
      'Application for Pattern/type approval created successfully | NMI Services portal',
    );
  });
});

describe(RequestForPatternApprovalCreated, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.sessionStorage.clear();
  });
  it('renders the submitted reference and page chrome metadata', () => {
    expect.assertions(1);
    renderCreatedRoute();
    expect(mocks.useBodyClass).toHaveBeenCalledWith('application-created');
  });
});

describe(RequestForPatternApprovalCreated, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.sessionStorage.clear();
  });
  it('renders the submitted reference and page chrome metadata', () => {
    expect.assertions(1);
    renderCreatedRoute();
    expect(screen.getByTestId('form-banner')).toHaveTextContent(
      'Pattern/type approval - Application',
    );
  });
});

describe(RequestForPatternApprovalCreated, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.sessionStorage.clear();
  });
  it('renders the submitted reference and page chrome metadata', () => {
    expect.assertions(1);
    renderCreatedRoute();
    expect(screen.getByTestId('form-banner')).toHaveTextContent(
      'Ref ID: PA-200',
    );
  });
});

describe(RequestForPatternApprovalCreated, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.sessionStorage.clear();
  });
  it('renders the submitted reference and page chrome metadata', () => {
    expect.assertions(1);
    renderCreatedRoute();
    expect(screen.getByTestId('form-banner')).toHaveTextContent(
      'Trading - Branch - National Measurement Institute',
    );
  });
});
