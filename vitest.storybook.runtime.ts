import type { Vitest } from 'vitest/node';
import type { Plugin } from 'vite';

type StorybookVitest = Pick<Vitest, 'init' | 'standalone'> & {
    config: {
        coverage: {
            exclude: string[];
        };
    };
};

type StorybookVitestPlugin = Plugin & {
    configureVitest: (context: { vitest: StorybookVitest }) => void;
};

/**
 * Compatibility policy for Test-panel runs owned by @storybook/addon-vitest.
 *
 * Storybook 10.5.10 calls Vitest's deprecated `init()` alias and replaces the
 * project's coverage options when its coverage toggle is enabled. Route the
 * dependency call to the supported API and keep JSON data out of V8 remapping.
 * Remove the init bridge after Storybook switches to `standalone()` upstream.
 */
export const storybookVitestRuntimePlugin: StorybookVitestPlugin = {
    name: 'nmi:storybook-vitest-runtime-policy',
    configureVitest({ vitest }) {
        vitest.config.coverage.exclude.push('ClientApp/src/**/*.json');
        vitest.init = vitest.standalone.bind(vitest);
    },
};
