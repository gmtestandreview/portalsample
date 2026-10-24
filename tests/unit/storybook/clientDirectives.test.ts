import { rolldown, type RolldownLog } from 'rolldown';
import { describe, expect, it } from 'vitest';

import { clientDirectives } from '../../../.storybook/clientDirectives';

async function bundleClientModule(source: string, extension = 'js') {
  const warnings: RolldownLog[] = [];
  const componentId = `/node_modules/example/component.${extension}`;
  const bundle = await rolldown({
    input: '/entry.js',
    external: ['react/jsx-runtime'],
    plugins: [
      {
        name: 'fixture',
        resolveId: (id) => id,
        load: (id) =>
          id === '/entry.js' ? `export * from '${componentId}';` : source,
      },
      clientDirectives(),
    ],
    onLog(level, log, handler) {
      if (level === 'warn') warnings.push(log);
      else handler(level, log);
    },
  });

  try {
    const { output } = await bundle.generate({
      format: 'es',
      banner: '"use client";',
      sourcemap: true,
    });
    const chunk = output.find((item) => item.type === 'chunk');
    if (!chunk) throw new Error('Expected a JavaScript chunk');
    return { chunk, warnings };
  } finally {
    await bundle.close();
  }
}

describe('storybook client directives', () => {
  it('hoists client boundaries to the chunk header without losing exports or maps', async () => {
    const source =
      '/* license */\r\n"use strict";\r\n"use client"\r\nexport const answer = 42;';
    const { chunk, warnings } = await bundleClientModule(source);

    expect(warnings).toEqual([]);
    expect(chunk.code.startsWith('"use client";')).toBe(true);
    expect(chunk.exports).toEqual(['answer']);
    expect(chunk.code).toContain('42');
    expect(chunk.map?.sourcesContent).toContain(source);
    expect(chunk.map?.mappings).toBeTypeOf('string');
  });

  it('handles TypeScript and JSX before Rolldown internal transforms', async () => {
    const { chunk, warnings } = await bundleClientModule(
      "'use client';\nexport const element = <div>{42 as number}</div>;",
      'tsx'
    );

    expect(warnings).toEqual([]);
    expect(chunk.exports).toEqual(['element']);
    expect(chunk.code).toContain('42');
  });

  it('retains other directive diagnostics and ordinary client strings', async () => {
    const { chunk, warnings } = await bundleClientModule(
      '"use client"; "use custom"; export const label = "use client";'
    );

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.code).toBe('MODULE_LEVEL_DIRECTIVE');
    expect(warnings[0]?.message).toContain('use custom');
    expect(chunk.code).toContain('label = "use client"');
  });
});
