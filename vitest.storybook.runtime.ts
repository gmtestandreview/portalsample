import type { Vitest } from 'vitest/node';
import type { Plugin } from 'vite';

type StorybookVitest = Pick<Vitest, 'standalone'> & {
  init: Vitest['standalone'];
  config: {
    coverage: {
      exclude: string[];
    };
  };
};

type StorybookVitestPlugin = Plugin & {
  configureVitest: (_context: { vitest: StorybookVitest }) => void;
};

export const jsonCoverageExclusion = 'ClientApp/src/**/*.json';

export const storybookVitestRuntimePlugin: StorybookVitestPlugin = {
  name: 'nmi:storybook-vitest-runtime-policy',
  configureVitest({ vitest }) {
    if (!vitest.config.coverage.exclude.includes(jsonCoverageExclusion)) {
      vitest.config.coverage.exclude.push(jsonCoverageExclusion);
    }
    Object.defineProperty(vitest, 'init', {
      value: vitest.standalone.bind(vitest),
      configurable: true,
      writable: true,
    });
  },
};
