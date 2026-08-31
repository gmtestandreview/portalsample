import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';
import MockDate from 'mockdate';
import { createElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { setupWorker } from 'msw/browser';
import addonMsw from 'msw-storybook-addon';
import '../ClientApp/public/fonts/fonts.css';
import '../ClientApp/public/fonts/nmi-iconfonts.css';
import '../ClientApp/src/styles/index.scss';
import './docs-table-styles.css';
import { mswHandlers } from './msw-handlers';
import { isStorybookMswDebugEnabled, onUnhandledStorybookRequest } from './msw-policy';
import './preview-setup';

const preview = definePreview({
    addons: [
        addonDocs(),
        ...(globalThis.navigator?.serviceWorker === undefined
            ? []
            : [addonMsw(async () => {
                const worker = setupWorker(...mswHandlers);
                await worker.start({
                    quiet: !isStorybookMswDebugEnabled(globalThis.location.search),
                    onUnhandledRequest: onUnhandledStorybookRequest,
                });
                return worker;
            })]),
    ],

    tags: ['autodocs'],

    decorators: [
        (Story, { parameters }) => {
            const initialEntries = (parameters?.portal?.initialEntries as string[]) ?? ['/'];
            // A story that renders a route reading useParams needs a pattern to match
            // against; under the catch-all every param is undefined, which is why
            // InstrMeasurementReport rendered an empty <h1>{id}</h1> and axe reported
            // empty-heading. Stories opt in via `portal.routePath`, and anything that does
            // not care keeps the catch-all it has always had.
            const routePath = (parameters?.portal?.routePath as string) ?? '*';
            const router = createMemoryRouter([{ path: routePath, element: createElement(Story) }], { initialEntries });
            return createElement(RouterProvider, { router });
        },
    ],

    async beforeEach() {
        globalThis.sessionStorage.setItem(
            'targetOrganisation',
            JSON.stringify({
                targetOrganisationAbn: '00000000000',
                targetOrganisationName: 'Storybook Organisation',
            }),
        );
        MockDate.set('2024-04-01T12:00:00Z');
    },

    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /date$/i,
            },
        },
        layout: 'centered',
        a11y: {
            config: {
                rules: [{ id: 'color-contrast', enabled: true }],
            },

            // 'todo' - show a11y violations in the test UI only
            // 'error' - fail CI on a11y violations
            // 'off' - skip a11y checks entirely
            //
            // Raised from 'todo' to 'error' once the suite reached zero violations across
            // the generated catalogue. Under 'todo' the checks ran but could never fail a build, so
            // four real defects sat unreported: unnamed progress bars, an aria-hidden
            // stepper containing focusable links, an empty h1, and muted text at 4.28:1 on
            // the grey band. Enforcing it is what stops the next one going unnoticed.
            test: 'error',
        },
        docs: {
            toc: {
                contentsSelector: '.sbdocs-content',
                headingSelector: 'h1, h2, h3',
                ignoreSelector: '#primary',
                title: 'Table of Contents',
                disable: false,
                unsafeTocbotOptions: {
                orderedList: false,
                },
            },
            codePanel: true,
            controls: {
                exclude: ['as', 'bsPrefix', 'ref', 'key'],
                sort: 'requiredFirst',
            },
            source: {
                excludeDecorators: true,
                type: 'auto',
            },
        },
    },
});

export default preview;
