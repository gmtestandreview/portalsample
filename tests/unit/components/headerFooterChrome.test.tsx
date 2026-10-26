import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
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
import {
  useModalDispatch,
  type ModalDispatch,
} from '@/components/modals/ModalContext';
import { getEnvironment } from '@/routes/common/helperFunctions';

type ActionClick = NonNullable<ComponentProps<typeof Actions>['onItemClick']>;

const msalState = vi.hoisted(() => ({
  authenticated: false,
}));

vi.mock(
  '@azure/msal-react',
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
      trackGAEvent: vi.fn<typeof trackGAEvent>(),
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  import('@/authentication/hooks'),
  () =>
    ({
      useAccountState: vi.fn<typeof useAccountState>(),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('@/components/modals/ModalContext'),
  () =>
    ({
      useModalDispatch: vi.fn<typeof useModalDispatch>(),
    }) satisfies __ExactMockModule<__TestMockModule27>,
);

vi.mock(
  import('@/routes/common/helperFunctions'),
  () =>
    ({
      getEnvironment: vi.fn<typeof getEnvironment>(),
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
  '@/components/modals/ContentModal',
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
      setShowBranchSelector: vi.fn<ModalDispatch['setShowBranchSelector']>(),
      setShowRFQDeleteModal: vi.fn<ModalDispatch['setShowRFQDeleteModal']>(),
      setShowRFQSelectModal: vi.fn<ModalDispatch['setShowRFQSelectModal']>(),
    });
  });

  it('renders the public header brand, feedback message, and unauthenticated exit link', () => {
    expect.hasAssertions();
    renderWithRouter(<Header />);

    expect(
      screen.getByRole('navigation', { name: 'Site header' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'National Measurement Institute logo' }),
    ).toHaveAttribute('href', '/');
    expect(
      screen.getByRole('img', { name: 'National Measurement Institute logo' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /quick survey\s*Opens in a new tab/i }),
    ).toHaveAttribute(
      'href',
      'https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu',
    );
    expect({
      exitHref: screen
        .getByRole('link', { name: /Exit/i })
        .getAttribute('href'),
      userMenu: screen.queryByTestId('user-menu-dropdown'),
    }).toEqual({
      exitHref: 'https://measurement.gov.au',
      userMenu: null,
    });
  });

  it('renders authenticated user menu items and tracks account-management clicks', async () => {
    expect.hasAssertions();
    const user = userEvent.setup();
    const modalDispatch = {
      setShowBranchSelector: vi.fn<ModalDispatch['setShowBranchSelector']>(),
      setShowRFQDeleteModal: vi.fn<ModalDispatch['setShowRFQDeleteModal']>(),
      setShowRFQSelectModal: vi.fn<ModalDispatch['setShowRFQSelectModal']>(),
    };
    msalState.authenticated = true;
    vi.mocked(getEnvironment).mockReturnValue('TEST');
    vi.mocked(useAccountState).mockReturnValue(
      accountState as unknown as ReturnType<typeof useAccountState>,
    );
    vi.mocked(useModalDispatch).mockReturnValue(modalDispatch);

    renderWithRouter(<Header />);

    expect({
      environment: screen.getByTestId('header-environment').textContent,
      user: screen.getByRole('button', { name: /Current user settings menu/i })
        .textContent,
      precision: screen.getByText('Precision Labs - Canberra').textContent,
      measurement: screen.getByText('Measurement Pty Ltd').textContent,
    }).toEqual({
      environment: 'Environment:TEST',
      user: expect.stringContaining('Alex Citizen'),
      precision: 'Precision Labs - Canberra',
      measurement: 'Measurement Pty Ltd',
    });

    await user.click(
      screen.getByRole('button', { name: /Current user settings menu/i }),
    );

    expect({
      manageOrganisation: screen
        .getByRole('link', { name: 'Manage organisation' })
        .getAttribute('href'),
      contactDetails: screen
        .getByRole('link', { name: 'My contact details' })
        .getAttribute('href'),
      logOut: screen
        .getByRole('link', { name: 'Log out' })
        .getAttribute('href'),
    }).toEqual({
      manageOrganisation: '/update-organisation/org-123',
      contactDetails: '/update-contact',
      logOut: '/sign-out',
    });

    await user.click(screen.getByRole('link', { name: 'Manage organisation' }));

    await user.click(
      screen.getByRole('button', { name: /Current user settings menu/i }),
    );
    await user.click(
      screen.getByRole('link', { name: 'Add or manage branch/location' }),
    );

    await user.click(
      screen.getByRole('button', { name: /Current user settings menu/i }),
    );
    await user.click(screen.getByRole('link', { name: 'My contact details' }));

    await user.click(
      screen.getByRole('button', { name: /Current user settings menu/i }),
    );
    await user.click(screen.getByRole('link', { name: 'Log out' }));

    expect({
      trackEvents: vi.mocked(trackGAEvent).mock.calls,
      branchSelector: modalDispatch.setShowBranchSelector.mock.calls,
    }).toEqual({
      trackEvents: [
        ['Manage organisation'],
        ['Manage branch/location'],
        ['Manage contact'],
        ['sign out'],
      ],
      branchSelector: [[true]],
    });
  });

  it('does not render authenticated menu content until account email is available', () => {
    expect.hasAssertions();
    vi.mocked(useAccountState).mockReturnValue({
      details: { givenName: 'Alex' },
    } as ReturnType<typeof useAccountState>);

    const { container } = renderWithRouter(<AuthenticatedNavbarItems />);

    expect(container).toBeEmptyDOMElement();
  });

  it('hides the environment label when no environment marker is detected', () => {
    expect.hasAssertions();
    const { container } = render(<NavbarEnvironment />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the feedback message as a new-tab survey link', () => {
    expect.hasAssertions();
    render(<NavbarMessage />);

    const survey = screen.getByRole('link', {
      name: /quick survey\s*Opens in a new tab/i,
    });

    expect(survey).toHaveAttribute('target', '_blank');
    expect(survey).toHaveAttribute('rel', 'external noopener noreferrer');
  });
});

describe('footer chrome', () => {
  it('renders static footer landmarks, links, and government crest', () => {
    expect.hasAssertions();
    renderWithRouter(<Footer />);

    expect(screen.getByTestId('nmi-footer')).toHaveTextContent(
      'Commonwealth of Australia',
    );
    expect(
      screen.getByRole('img', { name: 'Australian Government Coat of Arms' }),
    ).toHaveAttribute('src', 'gov-crest.svg');
    expect(screen.getByRole('link', { name: 'Help guide' })).toHaveAttribute(
      'href',
      '/help-guide',
    );
  });

  it('opens each footer content modal and closes it through the modal callback', async () => {
    expect.hasAssertions();
    const user = userEvent.setup();
    renderWithRouter(<Footer />);

    await user.click(screen.getByRole('button', { name: 'Terms of use' }));

    expect(
      screen.getByRole('dialog', { name: 'Portal Terms of Use' }),
    ).toHaveTextContent('1. General');

    await user.click(screen.getByRole('button', { name: 'Close modal' }));

    expect(
      screen.queryByRole('dialog', { name: 'Portal Terms of Use' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Privacy' }));

    expect(
      screen.getByRole('dialog', { name: 'Privacy collection statement' }),
    ).toHaveTextContent('The Privacy Act and your personal information');

    await user.click(screen.getByRole('button', { name: 'Close modal' }));

    await user.click(screen.getByRole('button', { name: 'Accessibility' }));

    expect(
      screen.getByRole('dialog', { name: 'Accessibility' }),
    ).toHaveTextContent('Portable Document Format');

    await user.click(screen.getByRole('button', { name: 'Close modal' }));

    expect(
      screen.queryByRole('dialog', { name: 'Accessibility' }),
    ).not.toBeInTheDocument();
  });

  it('renders footer static content with key headings and external links', () => {
    expect.hasAssertions();
    const { rerender } = render(<TermsOfUse />);

    expect({
      heading: screen.getByRole('heading', { name: '1. General' }).textContent,
      date: screen.getByText('9 July, 2024').textContent,
    }).toEqual({
      heading: '1. General',
      date: expect.stringContaining('9 July, 2024'),
    });

    rerender(<Privacy />);

    expect({
      heading: screen.getByRole('heading', {
        name: 'Types of personal information collected',
      }).textContent,
      privacyHref: screen
        .getByRole('link', { name: 'privacy@industry.gov.au' })
        .getAttribute('href'),
    }).toEqual({
      heading: 'Types of personal information collected',
      privacyHref: 'mailto:privacy@industry.gov.au',
    });

    rerender(<Accessibility />);

    expect({
      heading: screen.getByRole('heading', { name: 'JavaScript' }).textContent,
      target: screen
        .getByRole('link', {
          name: /Web Content Accessibility Guidelines.*Opens in a new tab/i,
        })
        .getAttribute('target'),
    }).toEqual({ heading: 'JavaScript', target: '_blank' });
  });
});

describe('small static display components', () => {
  it('applies the stable display classes for intro and body text wrappers', () => {
    expect.hasAssertions();
    const { rerender } = render(
      <HeaderIntroText className='mb-4'>Intro copy</HeaderIntroText>,
    );

    expect(screen.getByText('Intro copy')).toHaveClass(
      'header-intro-text',
      'mb-4',
    );

    rerender(<BodyText className='text-muted'>Body copy</BodyText>);

    expect(screen.getByText('Body copy')).toHaveClass(
      'body-text',
      'text-muted',
    );
  });

  it('renders the external link icon as decorative SVG with optional classes', () => {
    expect.hasAssertions();
    const { container } = render(<ExternalLinkIcon className='ms-1' />);

    const icon = container.querySelector('svg');

    expect(icon).toHaveClass('ms-1');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('focusable', 'false');
  });
});

describe('actions callback behavior', () => {
  it('uses item-specific click handlers before falling back to the shared item handler', async () => {
    expect.hasAssertions();
    const user = userEvent.setup();
    const itemClick = vi.fn<ActionClick>();
    const sharedClick = vi.fn<ActionClick>();
    renderWithRouter(
      <Actions
        id='callback-actions'
        onItemClick={sharedClick}
        dropDownActions={[
          { action: 'copy', text: 'Copy request', onClick: itemClick },
          { action: 'archive', text: 'Archive request' },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Copy request' }));
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archive request' }));

    expect(itemClick).toHaveBeenCalledTimes(1);
    expect(sharedClick).toHaveBeenCalledTimes(1);
  });
});
