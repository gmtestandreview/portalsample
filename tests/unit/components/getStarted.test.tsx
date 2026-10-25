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
      useIsAuthenticated: vi.fn(),
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
    expect.assertions(1);
    renderGetStarted();
    expect(
      screen.getByRole('heading', {
        name: /National Measurement Institute .* Services portal/i,
        level: 1,
      }),
    ).toBeInTheDocument();
  });
});

describe(GetStarted, () => {
  beforeEach(() => {
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    clearGetStartedNotification();
    document.body.className = '';
    document.title = '';
  });
  it('renders the unauthenticated entry content and pathway links', () => {
    expect.assertions(1);
    renderGetStarted();
    expect(
      screen.getByText(/request, receive and accept quotes/i),
    ).toBeInTheDocument();
  });
});

describe(GetStarted, () => {
  beforeEach(() => {
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    clearGetStartedNotification();
    document.body.className = '';
    document.title = '';
  });
  it('renders the unauthenticated entry content and pathway links', () => {
    expect.assertions(1);
    renderGetStarted();
    expect(
      screen.getByRole('link', { name: /How to set up access/i }),
    ).toHaveAttribute('href', '/help-guide/how-to-setup-access');
  });
});

describe(GetStarted, () => {
  beforeEach(() => {
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    clearGetStartedNotification();
    document.body.className = '';
    document.title = '';
  });
  it('renders the unauthenticated entry content and pathway links', () => {
    expect.assertions(1);
    renderGetStarted();
    expect(screen.getByRole('link', { name: /Log in/i })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });
});

describe(GetStarted, () => {
  beforeEach(() => {
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    clearGetStartedNotification();
    document.body.className = '';
    document.title = '';
  });
  it('renders the unauthenticated entry content and pathway links', () => {
    expect.assertions(1);
    renderGetStarted();
    expect(screen.getByRole('link', { name: /^Digital ID/i })).toHaveAttribute(
      'href',
      'https://www.digitalidsystem.gov.au',
    );
  });
});
