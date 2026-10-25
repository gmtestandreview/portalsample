import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryRouter } from 'react-router';

import Actions from '@/components/Actions';

import BodyText from '@/components/BodyText';

import Footer from '@/components/Footer';

import Accessibility from '@/components/Footer/accessibility';

import Privacy from '@/components/Footer/privacy';

import TermsOfUse from '@/components/Footer/termsOfUse';

import Header from '@/components/Header';

import AuthenticatedNavbarItems from '@/components/Header/AuthenticatedNavbarItems';

import NavbarEnvironment from '@/components/Header/NavbarEnvironment';

import NavbarMessage from '@/components/Header/NavbarMessage';

import HeaderIntroText from '@/components/HeaderIntroText';

import ExternalLinkIcon from '@/components/Icons/ExternalLinkIcon';

import { trackGAEvent } from '@/analytics/GoogleAnalytics';

import { useAccountState } from '@/authentication/hooks';

import { useModalDispatch } from '@/components/modals/ModalContext';

import { getEnvironment } from '@/routes/common/helperFunctions';

const msalState = vi.hoisted(() => ({
  authenticated: false,
}));

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      AuthenticatedTemplate: ({ children }: { children: React.ReactNode }) =>
        msalState.authenticated ? children : null,
      UnauthenticatedTemplate: ({ children }: { children: React.ReactNode }) =>
        msalState.authenticated ? null : children,
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  import('@/authentication/hooks'),
  () =>
    ({
      useAccountState: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('@/components/modals/ModalContext'),
  () =>
    ({
      useModalDispatch: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule27>,
);

vi.mock(
  import('@/routes/common/helperFunctions'),
  () =>
    ({
      getEnvironment: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule9>,
);

vi.mock(
  import('@/assets/GovCrest.svg'),
  () =>
    ({
      default: 'gov-crest.svg',
    }) satisfies __ExactMockModule<__TestMockModule19>,
);

vi.mock(
  import('@/components/modals/ContentModal'),
  () =>
    ({
      default: ({
        showModal,
        onCancelModal,
        modalBody,
        modalTitle,
      }: {
        showModal: boolean;
        onCancelModal: () => void;
        modalBody: React.ReactNode;
        modalTitle: string;
      }) =>
        showModal ? (
          <dialog open aria-label={modalTitle}>
            <h2>{modalTitle}</h2>
            <div>{modalBody}</div>
            <button type='button' onClick={onCancelModal}>
              Close modal
            </button>
          </dialog>
        ) : null,
    }) satisfies __ExactMockModule<__TestMockModule28>,
);

const renderWithRouter = (ui: React.ReactNode) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const accountState = {
  details: {
    email: 'alex.citizen@example.gov.au',
    givenName: 'Alex',
    familyName: 'Citizen',
    trading: 'Precision Labs',
    branch: 'Canberra',
    organisation: 'Measurement Pty Ltd',
    defaultOrganisationId: 'org-123',
  },
};

describe('header chrome', () => {
  beforeEach(() => {
    msalState.authenticated = false;
    vi.mocked(getEnvironment).mockReturnValue('');
    vi.mocked(trackGAEvent).mockClear();
    vi.mocked(useAccountState).mockReturnValue(null);
    vi.mocked(useModalDispatch).mockReturnValue({
      setShowBranchSelector: vi.fn(),
      setShowRFQDeleteModal: vi.fn(),
      setShowRFQSelectModal: vi.fn(),
    });
  });
  it('renders the public header brand, feedback message, and unauthenticated exit link', () => {
    expect.assertions(1);
    renderWithRouter(<Header />);
    expect(
      screen.getByRole('navigation', { name: 'Site header' }),
    ).toBeInTheDocument();
  });
});

describe('header chrome', () => {
  beforeEach(() => {
    msalState.authenticated = false;
    vi.mocked(getEnvironment).mockReturnValue('');
    vi.mocked(trackGAEvent).mockClear();
    vi.mocked(useAccountState).mockReturnValue(null);
    vi.mocked(useModalDispatch).mockReturnValue({
      setShowBranchSelector: vi.fn(),
      setShowRFQDeleteModal: vi.fn(),
      setShowRFQSelectModal: vi.fn(),
    });
  });
  it('renders the public header brand, feedback message, and unauthenticated exit link', () => {
    expect.assertions(1);
    renderWithRouter(<Header />);
    expect(
      screen.getByRole('link', { name: 'National Measurement Institute logo' }),
    ).toHaveAttribute('href', '/');
  });
});

describe('header chrome', () => {
  beforeEach(() => {
    msalState.authenticated = false;
    vi.mocked(getEnvironment).mockReturnValue('');
    vi.mocked(trackGAEvent).mockClear();
    vi.mocked(useAccountState).mockReturnValue(null);
    vi.mocked(useModalDispatch).mockReturnValue({
      setShowBranchSelector: vi.fn(),
      setShowRFQDeleteModal: vi.fn(),
      setShowRFQSelectModal: vi.fn(),
    });
  });
  it('renders the public header brand, feedback message, and unauthenticated exit link', () => {
    expect.assertions(1);
    renderWithRouter(<Header />);
    expect(
      screen.getByRole('img', { name: 'National Measurement Institute logo' }),
    ).toBeInTheDocument();
  });
});

describe('header chrome', () => {
  beforeEach(() => {
    msalState.authenticated = false;
    vi.mocked(getEnvironment).mockReturnValue('');
    vi.mocked(trackGAEvent).mockClear();
    vi.mocked(useAccountState).mockReturnValue(null);
    vi.mocked(useModalDispatch).mockReturnValue({
      setShowBranchSelector: vi.fn(),
      setShowRFQDeleteModal: vi.fn(),
      setShowRFQSelectModal: vi.fn(),
    });
  });
  it('renders the public header brand, feedback message, and unauthenticated exit link', () => {
    expect.assertions(1);
    renderWithRouter(<Header />);
    expect(
      screen.getByRole('link', { name: /quick survey\s*Opens in a new tab/i }),
    ).toHaveAttribute(
      'href',
      'https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu',
    );
  });
});

describe('header chrome', () => {
  beforeEach(() => {
    msalState.authenticated = false;
    vi.mocked(getEnvironment).mockReturnValue('');
    vi.mocked(trackGAEvent).mockClear();
    vi.mocked(useAccountState).mockReturnValue(null);
    vi.mocked(useModalDispatch).mockReturnValue({
      setShowBranchSelector: vi.fn(),
      setShowRFQDeleteModal: vi.fn(),
      setShowRFQSelectModal: vi.fn(),
    });
  });
  it('renders the public header brand, feedback message, and unauthenticated exit link', () => {
    expect.assertions(1);
    renderWithRouter(<Header />);
    expect(screen.getByRole('link', { name: /Exit/i })).toHaveAttribute(
      'href',
      'https://measurement.gov.au',
    );
  });
});
