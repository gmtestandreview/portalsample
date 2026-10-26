import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsAuthenticated } from '@azure/msal-react';
import GetStarted from '@/components/get-started/get-started';
import {
  clearGetStartedNotification,
  setGetStartedNotification,
} from '@/storage/notification';
import { NotificationSeverity } from '@/storage/types';

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useIsAuthenticated: vi.fn<typeof useIsAuthenticated>(),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

const renderGetStarted = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path='/' element={<GetStarted />} />
        <Route path='/dashboard' element={<main>Dashboard route</main>} />
        <Route
          path='/help-guide/how-to-setup-access'
          element={<main>Setup guide</main>}
        />
      </Routes>
    </MemoryRouter>,
  );

describe(GetStarted, () => {
  beforeEach(() => {
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    clearGetStartedNotification();
    document.body.className = '';
    document.title = '';
  });

  it('renders the unauthenticated entry content and pathway links', () => {
    expect.hasAssertions();

    renderGetStarted();

    expect(
      screen.getByRole('heading', {
        name: /National Measurement Institute .* Services portal/i,
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/request, receive and accept quotes/i),
    ).toBeInTheDocument();
    expect({
      howToSetUpAccess: screen
        .getByRole('link', { name: /How to set up access/i })
        .getAttribute('href'),
      login: screen.getByRole('link', { name: /Log in/i }).getAttribute('href'),
      digitalId: screen
        .getByRole('link', { name: /^Digital ID/i })
        .getAttribute('href'),
    }).toEqual({
      howToSetUpAccess: '/help-guide/how-to-setup-access',
      login: '/dashboard',
      digitalId: 'https://www.digitalidsystem.gov.au',
    });
    expect({
      title: document.title,
      bodyHasHomeClass: document.body.classList.contains('home'),
    }).toEqual({
      title: 'NMI Services portal | NMI',
      bodyHasHomeClass: true,
    });
  });

  it('renders and clears a stored get-started notification', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    setGetStartedNotification({
      severity: NotificationSeverity.Information,
      message: 'Your session expired. Please sign in again.',
    });

    renderGetStarted();

    expect(
      screen.getByText('Your session expired. Please sign in again.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close alert/i }));

    await waitFor(() => {
      expect(
        screen.queryByText('Your session expired. Please sign in again.'),
      ).not.toBeInTheDocument();
    });
  });

  it('redirects authenticated users to the dashboard', () => {
    expect.hasAssertions();

    vi.mocked(useIsAuthenticated).mockReturnValue(true);

    renderGetStarted();

    expect(screen.getByRole('main')).toHaveTextContent('Dashboard route');
    expect(
      screen.queryByRole('heading', {
        name: /National Measurement Institute/i,
      }),
    ).not.toBeInTheDocument();
  });
});
