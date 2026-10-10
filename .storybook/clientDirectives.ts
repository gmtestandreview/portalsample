import { RolldownMagicString } from 'rolldown';
import type { Plugin } from 'vite';

/**
 * Storybook is entirely client-rendered. Hoist module client markers to the
 * output banner in main.ts, where Rolldown can preserve them on every chunk.
 * Other directives and their diagnostics remain owned by the bundler.
 * https://rolldown.rs/in-depth/directives#other-directives
 */
export function clientDirectives(): Plugin {
  return {
    name: 'storybook-client-directives',
    apply: 'build',
    enforce: 'post',
    transform: {
      filter: { moduleType: ['js', 'jsx', 'ts', 'tsx'], code: 'use client' },
      handler(code, id, options) {
        const moduleType = options?.moduleType;
        let lang: 'js' | 'jsx' | 'ts' | 'tsx';
        switch (moduleType) {
          case 'tsx':
            lang = 'tsx';
            break;
          case 'ts':
            lang = 'ts';
            break;
          case 'jsx':
            lang = 'jsx';
            break;
          default:
            lang = 'js';
            break;
        }
        const ast = this.parse(code, { lang });
        const transformed = new RolldownMagicString(code);

        for (const statement of ast.body) {
          if (
            statement.type !== 'ExpressionStatement' ||
            !('directive' in statement)
          ) {
            break;
          }
          if (statement.directive === 'use client') {
            transformed.remove(statement.start, statement.end);
          }
        }

        if (!transformed.hasChanged()) return null;

        return {
          code: transformed.toString(),
          map: transformed.generateMap({ source: id, hires: true }).toString(),
        };
      },
    },
  };
}
