import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Root, { HydrateFallback, Layout } from '@/root';

// `Links`, `Meta`, `Scripts` and `ScrollRestoration` need a framework-mode
// router context that only exists in a real React Router build.
vi.mock(
  import('react-router'),
  (async (importOriginal: () => Promise<Record<string, unknown>>) => ({
    ...(await importOriginal()),
    Links: () => <link rel='stylesheet' href='/stub.css' />,
    Meta: () => <meta name='stub-meta' content='meta' />,
    Scripts: () => <script src='/stub-entry.js' />,
    ScrollRestoration: () => <div id='stub-scroll' />,
  })) as unknown as __DynamicPartialMockFactory<__TestMockModule11>,
);

const renderDocument = () =>
  new DOMParser().parseFromString(
    renderToStaticMarkup(
      <Layout>
        <main id='app-child'>app content</main>
      </Layout>,
    ),
    'text/html',
  );

describe(Layout, () => {
  it('renders the html shell with head metadata and branding assets', () => {
    expect.hasAssertions();

    const doc = renderDocument();

    // The parsed document comes from a separate DOM realm, so jest-dom element
    // matchers reject it; read attributes directly instead.
    const attribute = (selector: string, name: string) =>
      doc.querySelector(selector)?.getAttribute(name);

    expect(doc.documentElement.getAttribute('lang')).toBe('en');
    expect(doc.title).toBe('NMI Services Portal');
    expect(attribute('meta[charset]', 'charset')).toBe('UTF-8');
    expect(attribute('meta[name="viewport"]', 'content')).toBe(
      'width=device-width, initial-scale=1.0',
    );
  });

  it('renders the branding, environment and runtime config assets', () => {
    expect.hasAssertions();

    const doc = renderDocument();
    const attribute = (selector: string, name: string) =>
      doc.querySelector(selector)?.getAttribute(name);

    expect(attribute('meta[name="theme-color"]', 'content')).toBe('#285576');
    expect(attribute('meta[name="nmi-environment"]', 'content')).toBe(
      String(import.meta.env.VITE_ENVIRONMENT),
    );
    expect(attribute('link[rel="icon"]', 'href')).toBe('/favicon.ico');
    expect(attribute('link[rel="apple-touch-icon"]', 'href')).toBe(
      '/NMI-tile.png',
    );
    expect(doc.querySelector('script[src="/env.js"]')).not.toBeNull();
  });

  it('renders the framework head and body hooks around the children', () => {
    expect.hasAssertions();

    const doc = renderDocument();

    expect(doc.head.querySelector('meta[name="stub-meta"]')).not.toBeNull();
    expect(doc.head.querySelector('link[href="/stub.css"]')).not.toBeNull();
    expect(doc.body.querySelector('#app-child')?.textContent).toBe(
      'app content',
    );
    expect(doc.body.querySelector('#stub-scroll')).not.toBeNull();
    expect(
      doc.body.querySelector('script[src="/stub-entry.js"]'),
    ).not.toBeNull();
  });
});

describe(Root, () => {
  it('renders the matched child route through the outlet', () => {
    expect.hasAssertions();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Root />}>
            <Route index element={<p>child route</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('child route')).toBeInTheDocument();
  });
});

describe(HydrateFallback, () => {
  it('shows a loading indicator while the client hydrates', () => {
    expect.hasAssertions();

    render(<HydrateFallback />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
