import type { Preview } from '@storybook/react-vite';
import MockDate from 'mockdate';
import { createElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { mswLoader } from 'msw-storybook-addon/csf3';
import '../ClientApp/public/fonts/fonts.css';
import '../ClientApp/public/fonts/nmi-iconfonts.css';
import '../ClientApp/src/styles/index.scss';
import './docs-table-styles.css';
import { mswHandlers } from './msw-handlers';
import './preview-setup';
import { autoDocsTemplate, expectedAddonDocsConfig } from './preview-docs';
export { mockMsalContext, mockAppInsights } from './storybookMocks';

export default {
    tags: ['autodocs'],

    decorators: [
        (Story, { parameters }) => {
            const initialEntries = (parameters?.portal
                ?.initialEntries as string[]) ?? ['/'];
            const router = createMemoryRouter(
                [{ path: '*', element: createElement(Story) }],
                { initialEntries },
            );
            return createElement(RouterProvider, { router });
        },
    ],

    loaders: [...(navigator?.serviceWorker === undefined ? [] : [mswLoader()])],

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
        msw: {
            handlers: mswHandlers,
        },
        controls: {
            hideNoControlsWarning: true,
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
            test: 'todo',
        },
        docs: {
            enabled: true,
            autodocs: expectedAddonDocsConfig.options.autodocs,
            toc: true,
            controls: {
                exclude: ['as', 'bsPrefix', 'ref', 'key'],
            },
            canvas: { sourceState: 'shown' },
            source: {
                excludeDecorators: true,
                type: 'dynamic',
            },
            description: {
                component:
                    'Component documentation generated from JSDoc comments and Storybook autodocs.',
            },
            page: autoDocsTemplate,
        },
    },
} satisfies Preview;
