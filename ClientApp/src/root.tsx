import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { ReactNode } from 'react';
import './styles/index.scss';
import BlockUISpinner from './components/BlockUISpinner';

export function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <meta name='theme-color' content='#285576' />
        <meta name='msapplication-TileColor' content='#285576' />
        <meta name='msapplication-TileImage' content='/NMI-tile.png' />
        <meta property='og:image' content='/NMI-tile.png' />
        <meta
          name='nmi-environment'
          content={import.meta.env.VITE_ENVIRONMENT}
        />
        <title>NMI Services Portal</title>
        <link
          rel='icon'
          href='/favicon.ico'
          sizes='any'
          type='image/vnd.microsoft.icon'
        />
        <link rel='apple-touch-icon' href='/NMI-tile.png' />
        <script src='/env.js' />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function HydrateFallback() {
  return (
    <BlockUISpinner>
      <p>Loading...</p>
    </BlockUISpinner>
  );
}
