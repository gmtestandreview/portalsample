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
    expect.assertions(1);
    const source =
      '/* license */\r\n"use strict";\r\n"use client"\r\nexport const answer = 42;';
    const { chunk, warnings } = await bundleClientModule(source);
    expect(warnings).toEqual([]);
  });
});

describe('storybook client directives', () => {
  it('hoists client boundaries to the chunk header without losing exports or maps', async () => {
    expect.assertions(1);
    const source =
      '/* license */\r\n"use strict";\r\n"use client"\r\nexport const answer = 42;';
    const { chunk, warnings } = await bundleClientModule(source);
    expect(chunk.code.startsWith('"use client";')).toBe(true);
  });
});

describe('storybook client directives', () => {
  it('hoists client boundaries to the chunk header without losing exports or maps', async () => {
    expect.assertions(1);
    const source =
      '/* license */\r\n"use strict";\r\n"use client"\r\nexport const answer = 42;';
    const { chunk, warnings } = await bundleClientModule(source);
    expect(chunk.exports).toEqual(['answer']);
  });
});

describe('storybook client directives', () => {
  it('hoists client boundaries to the chunk header without losing exports or maps', async () => {
    expect.assertions(1);
    const source =
      '/* license */\r\n"use strict";\r\n"use client"\r\nexport const answer = 42;';
    const { chunk, warnings } = await bundleClientModule(source);
    expect(chunk.code).toContain('42');
  });
});

describe('storybook client directives', () => {
  it('hoists client boundaries to the chunk header without losing exports or maps', async () => {
    expect.assertions(1);
    const source =
      '/* license */\r\n"use strict";\r\n"use client"\r\nexport const answer = 42;';
    const { chunk, warnings } = await bundleClientModule(source);
    expect(chunk.map?.sourcesContent).toContain(source);
  });
});
