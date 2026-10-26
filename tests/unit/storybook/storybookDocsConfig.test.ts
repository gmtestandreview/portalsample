import ts from 'typescript';
import type { UserConfig } from 'vite';
import { describe, expect, it } from 'vitest';
import storybookConfig from '../../../.storybook/main';
import { onLog } from '../../../.storybook/rollupOnLog';
import { pathExists, readTextFileSync } from '../../helpers/safeTestFilesystem';

const testRoot = process.cwd();
const readFileSync = (filePath: string, _encoding: 'utf8'): string =>
  readTextFileSync(filePath, testRoot);
const existsSync = (filePath: string): boolean =>
  pathExists(filePath, testRoot);

const main = readFileSync('.storybook/main.ts', 'utf8');
const preview = readFileSync('.storybook/preview.ts', 'utf8');
const previewHead = readFileSync('.storybook/preview-head.html', 'utf8');
const componentDocsGuide = readFileSync(
  '.storybook/component-docs-guide.mdx',
  'utf8',
);
const introduction = readFileSync('.storybook/introduction.mdx', 'utf8');
const styleGuide = readFileSync('.storybook/style-guide.mdx', 'utf8');
const scssVariables = readFileSync(
  'ClientApp/src/styles/_variables.scss',
  'utf8',
);
const docsVerifier = readFileSync('scripts/verify-storybook-docs.mjs', 'utf8');
const tsconfigJson = ts.parseConfigFileTextToJson(
  'tsconfig.json',
  readFileSync('tsconfig.json', 'utf8'),
).config as {
  compilerOptions?: { types?: string[] };
};
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const allDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

const declaredVersion = (packageName: string) =>
  Object.entries(allDependencies)
    .find(([dependencyName]) => dependencyName === packageName)?.[1]
    ?.replace(/^[~^]/, '');

const rawStoryFiles = import.meta.glob(
  '../../../ClientApp/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  { eager: true, import: 'default', query: '?raw' },
) as Record<string, string>;

const rawStandingGuidanceDocuments = {
  ...import.meta.glob('../../../docs/**/*.md', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  ...import.meta.glob('../../../.storybook/*.mdx', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
} as Record<string, string>;

const toRepoPath = (globPath: string) =>
  globPath.slice('../../../'.length).replace(/\\/g, '/');

const storyFiles = Object.entries(rawStoryFiles).map(
  ([globPath, contents]) => ({
    path: toRepoPath(globPath),
    contents,
  }),
);

/**
 * Directories that record what the documentation architecture *was* — baselines,
 * change records, plans, and review notes. They legitimately quote the removed
 * configuration as evidence, so they are history rather than standing guidance.
 */
const historicalRecordPaths = [
  'docs/change-record/',
  'docs/migration/',
  'docs/qa/',
  'docs/sprint-1/',
  'docs/superpowers/',
  'docs/storybook/storybook-refactor-baseline.md',
];

/**
 * Every document a developer could reasonably read as current instruction on how
 * to write Storybook documentation in this repository.
 */
const standingGuidanceDocuments = [
  ...Object.entries(rawStandingGuidanceDocuments).map(
    ([globPath, contents]) => ({
      path: toRepoPath(globPath),
      contents,
    }),
  ),
].filter(
  ({ path }) =>
    !historicalRecordPaths.some((prefix) => path.startsWith(prefix)),
);

/**
 * Architecture this refactor removed. Any standing guidance still teaching one of
 * these sends developers to a configuration the repository no longer has.
 */
const removedArchitecturePatterns: { label: string; pattern: RegExp }[] = [
  {
    label: "'docs' tag taught as the Autodocs trigger",
    pattern: /\b(?:add|added|adding)\s+the\s+['"`]docs['"`]\s+tag\b/i,
  },
  {
    label: "'docs' listed in a story tags array",
    pattern: /tags:\s*\[[^\]]*['"]docs['"]/,
  },
  {
    label: 'addon-level autodocs option',
    pattern: /autodocs:\s*['"]tag['"]/,
  },
  {
    label: 'removed canvas sourceState',
    pattern: /sourceState:\s*['"]shown['"]/,
  },
  {
    label: 'removed generic global component description',
    pattern:
      /Component documentation generated from JSDoc comments and Storybook autodocs/,
  },
  {
    label: 'removed cloned Autodocs template',
    pattern: /autoDocsTemplate/,
  },
  {
    label: 'removed Webpack-only styling addon',
    pattern: /@storybook\/addon-styling-webpack/,
  },
];

describe('storybook documentation architecture', () => {
  it('keeps AutoSuggest ownership and Loading controls truthful', () => {
    expect.hasAssertions();

    const autoSuggestStory = readFileSync(
      'ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx',
      'utf8',
    );

    expect(autoSuggestStory).toMatch(
      /subcomponents:\s*\{\s*AutoSuggestContainer\s*\}/,
    );
    expect(autoSuggestStory).toMatch(
      /name:\s*['"]Loading \(AutoSuggestContainer\)['"]/,
    );
    expect(autoSuggestStory).toMatch(
      /Loading[\s\S]*argTypes:[\s\S]*getOptions:[\s\S]*table:\s*\{[\s\S]*disable:\s*true/,
    );
    expect(autoSuggestStory).toMatch(
      /Loading[\s\S]*argTypes:[\s\S]*selectedOption:[\s\S]*table:\s*\{[\s\S]*disable:\s*true/,
    );
  });

  it('exposes AcceptQuote step APIs as peers without changing legacy stories', () => {
    expect.hasAssertions();

    const acceptQuoteStory = readFileSync(
      'ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx',
      'utf8',
    );

    expect(acceptQuoteStory).toMatch(
      /subcomponents:\s*\{[\s\S]*PaymentDetails,[\s\S]*DeliveryAndReturn,[\s\S]*QuotationSummary,[\s\S]*SummaryAndAccept[\s\S]*\}/,
    );

    for (const storyExport of [
      'ReportRecipientStep',
      'PaymentDetailsStep',
      'DeliveryAndReturnStep',
      'QuotationSummaryStep',
      'SummaryAndAcceptStep',
    ]) {
      expect(acceptQuoteStory).toContain(`export const ${storyExport}`);
    }
  });

  it('validates the approved T4 contract packet before story execution', () => {
    expect.hasAssertions();

    expect(existsSync('.storybook/undocumented-component-contracts.mdx')).toBe(
      true,
    );

    const contracts = readFileSync(
      '.storybook/undocumented-component-contracts.mdx',
      'utf8',
    );
    const requiredOwners = [
      [
        'AriaButton',
        'ClientApp/src/components/AriaComponents/AriaButton/Button.tsx',
      ],
      ['Link', 'ClientApp/src/components/AriaComponents/Link/Link.tsx'],
      [
        'SegmentedControl',
        'ClientApp/src/components/AriaComponents/SegmentControl/SegmentedControl.tsx',
      ],
      ['Sheet', 'ClientApp/src/components/AriaComponents/Sheet/Sheet.tsx'],
      [
        'AlertMessage',
        'ClientApp/src/components/reactaria_components/AlertMessage.tsx',
      ],
      [
        'PageHeader',
        'ClientApp/src/components/reactaria_components/PageHeader.tsx',
      ],
      [
        'React Aria StatusPill',
        'ClientApp/src/components/reactaria_components/StatusPill.tsx',
      ],
    ];
    const requiredStories = [
      {
        path: 'ClientApp/src/components/AriaComponents/AriaButton/AriaButton.stories.tsx',
        exports: ['Primary', 'KeyboardActivation', 'Disabled', 'Pending'],
      },
      {
        path: 'ClientApp/src/components/AriaComponents/Link/Link.stories.tsx',
        exports: ['NavigatesWithHref', 'LinkRoleWithoutHref', 'Disabled'],
      },
      {
        path: 'ClientApp/src/components/AriaComponents/SegmentControl/SegmentedControl.stories.tsx',
        exports: ['SelectionChanges', 'KeyboardSelection', 'DisabledItem'],
      },
      {
        path: 'ClientApp/src/components/AriaComponents/Sheet/Sheet.stories.tsx',
        exports: ['ContextDrivenOpenAndDismiss'],
      },
      {
        path: 'ClientApp/src/components/reactaria_components/AlertMessage.stories.tsx',
        exports: ['Default', 'WarningTone', 'LongMessage'],
      },
      {
        path: 'ClientApp/src/components/reactaria_components/PageHeader.stories.tsx',
        exports: ['TitleOnly', 'WithContextAndActions', 'LongContent'],
      },
      {
        path: 'ClientApp/src/components/reactaria_components/StatusPill.stories.tsx',
        exports: ['Neutral', 'ToneVariants', 'LongLabel'],
      },
    ];

    expect([
      contracts.includes('T4a'),
      contracts.includes('APPROVED FOR T4 STORY IMPLEMENTATION'),
      contracts.includes('Approved API table'),
      contracts.includes('Inherited-prop scope'),
      contracts.includes('Approval provenance'),
      /approved by the user in the 2026-10-18\s+conversation/.test(contracts),
    ]).toStrictEqual([true, true, true, true, true, true]);

    expect(
      requiredStories.every(({ path, exports }) => {
        if (!existsSync(path)) {
          return false;
        }

        const storyContents = readFileSync(path, 'utf8');
        return exports.every((storyExport) =>
          storyContents.split(/\r?\n/).some((line) => {
            if (!line.includes(`export const ${storyExport}`)) {
              return false;
            }

            return line.includes(': Story') || line.includes('= meta.story(');
          }),
        );
      }),
    ).toBe(true);

    expect(
      requiredOwners.every(([owner, identity]) => {
        if (identity === undefined) {
          return false;
        }

        const sectionStart = contracts.indexOf(`## ${owner}`);
        const nextSection = contracts.indexOf('\n## ', sectionStart + 1);
        const section = contracts.slice(
          sectionStart,
          nextSection === -1 ? contracts.length : nextSection,
        );

        return (
          section.includes(`## ${owner}`) &&
          section.includes(identity) &&
          section.includes('Approved API table') &&
          section.includes('Inherited-prop scope') &&
          section.includes('Approval provenance') &&
          !section.includes('PENDING MAINTAINER APPROVAL')
        );
      }),
    ).toBe(true);

    expect([
      contracts.includes('ClientApp/src/components/Pill/StatusPill.tsx'),
      contracts.includes(
        'ClientApp/src/components/reactaria_components/StatusPill.tsx',
      ),
      contracts.includes('not the same component'),
      contracts.includes('components-pill--dashboard-statuses'),
      contracts.includes('components-pill--quote-statuses'),
    ]).toStrictEqual([true, true, true, true, true]);
  });

  it('presents RouteLeavingGuard types and quoted defaults separately', () => {
    expect.hasAssertions();

    const guardStory = readFileSync(
      'ClientApp/src/components/RouteLeavingGuard/RouteLeavingGuard.stories.tsx',
      'utf8',
    );

    expect(guardStory).toMatch(
      /argTypes:\s*\{[\s\S]*when:[\s\S]*type:\s*\{\s*summary:\s*['"]boolean['"]/,
    );
    expect(guardStory).toMatch(
      /title:[\s\S]*defaultValue:\s*\{\s*summary:\s*['"]'Unsaved changes'['"]/,
    );
    expect(guardStory).toMatch(
      /confirmBtn:[\s\S]*defaultValue:\s*\{\s*summary:\s*['"]'Discard changes'['"]/,
    );
  });

  it('records Storybook 10.6.3 provenance and upstream wording ownership', () => {
    expect.hasAssertions();

    expect([
      componentDocsGuide.includes('Storybook 10.6.3'),
      componentDocsGuide.includes('Storybook 9 Essential Changes'),
      componentDocsGuide.includes('upstream'),
      /not a local\s+wording fix/.test(componentDocsGuide),
      componentDocsGuide.includes('components-routeleavingguard'),
      componentDocsGuide.includes('title?: ReactNode = Unsaved changes'),
    ]).toStrictEqual([true, true, true, true, true, true]);
  });

  it('keeps main.ts syntactically valid', () => {
    expect.hasAssertions();

    const result = ts.transpileModule(main, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ESNext,
      },
      fileName: '.storybook/main.ts',
      reportDiagnostics: true,
    });
    const syntaxErrors = (result.diagnostics ?? [])
      .filter(
        (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
      )
      .map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      );

    expect(syntaxErrors).toStrictEqual([]);
  });

  it('uses the audited latest stable Storybook package set', () => {
    expect.hasAssertions();

    const storybookPackages = [
      'storybook',
      '@storybook/react-vite',
      '@storybook/addon-a11y',
      '@storybook/addon-docs',
      '@storybook/addon-links',
      '@storybook/addon-vitest',
      'eslint-plugin-storybook',
    ];

    for (const packageName of storybookPackages) {
      expect(declaredVersion(packageName), packageName).toBe('10.6.3');
    }

    expect(declaredVersion('@storybook/addon-mcp')).toBe('10.6.3');
    expect(declaredVersion('@chromatic-com/storybook')).toBe('5.6.0');
    expect(declaredVersion('msw-storybook-addon')).toBe('3.0.3');
  });

  it('uses React Vite without obsolete or unused Storybook addons', () => {
    expect.hasAssertions();

    expect(main).toMatch(/framework:\s*["']@storybook\/react-vite["']/);
    expect(main).not.toContain('@storybook/addon-styling-webpack');
    expect(allDependencies).not.toHaveProperty(
      '@storybook/addon-styling-webpack',
    );
    expect(allDependencies).not.toHaveProperty('@storybook/addon-onboarding');
    expect(allDependencies).not.toHaveProperty('@storybook/addon-designs');
  });

  it('enables agentic review for direct Storybook MCP clients', () => {
    expect.hasAssertions();

    expect(main).toMatch(/features:\s*\{[\s\S]*experimentalReview:\s*true/);
    expect(main).toMatch(/features:\s*\{[\s\S]*changeDetection:\s*true/);
  });

  it('preserves Sass compatibility and the size budget while splitting the preview runtime', async () => {
    expect.hasAssertions();

    const viteFinal = storybookConfig.viteFinal;
    if (!viteFinal) {
      throw new Error('Storybook viteFinal configuration is required');
    }

    const viteConfig: UserConfig = await viteFinal(
      {},
      {} as Parameters<typeof viteFinal>[1],
    );

    expect(viteConfig.css?.preprocessorOptions?.scss).toMatchObject({
      quietDeps: true,
      silenceDeprecations: [
        'import',
        'global-builtin',
        'color-functions',
        'if-function',
      ],
    });
    expect(viteConfig.build?.chunkSizeWarningLimit).toBe(1152);
    expect(viteConfig.build?.rolldownOptions?.onLog).toBe(onLog);
    expect(viteConfig.build?.rolldownOptions?.output).toMatchObject({
      banner: '"use client";',
      strictExecutionOrder: true,
      codeSplitting: {
        groups: expect.arrayContaining([
          { name: 'react-runtime', test: expect.any(RegExp) },
          { name: 'auth', test: expect.any(RegExp) },
          { name: 'forms', test: expect.any(RegExp) },
          { name: 'ui', test: expect.any(RegExp) },
          { name: 'utilities', test: expect.any(RegExp) },
          { name: 'storybook-runtime', test: expect.any(RegExp) },
        ]),
      },
    });
  });

  it('uses non-overlapping canonical story and MDX globs', () => {
    expect.hasAssertions();

    expect(main).toMatch(/["']\.\.\/\.storybook\/\*\.mdx["']/);
    expect(main).toMatch(/["']\.\.\/ClientApp\/src\/\*\*\/\*\.mdx["']/);
    expect(main).toMatch(
      /["']\.\.\/ClientApp\/src\/\*\*\/\*\.stories\.@\(js\|jsx\|mjs\|ts\|tsx\)["']/,
    );

    expect(main).not.toContain("'../ClientApp/src/**/*.stories.@(ts|tsx)'");
    expect(main).not.toContain("'../ClientApp/src/**/*.{docs,Docs}.mdx'");
  });

  it('owns generated docs naming and docs mode in main.ts', () => {
    expect.hasAssertions();

    expect([
      /docs:\s*\{[\s\S]*defaultName:\s*['"]Documentation['"]/.test(main),
      /docs:\s*\{[\s\S]*docsMode:\s*false/.test(main),
      main.match(/defaultName:/g)?.length === 1,
      main.match(/docsMode:/g)?.length === 1,
      !/autodocs:\s*['"]tag['"]/.test(main),
      !/docsMode:\s*true/.test(main),
    ]).toStrictEqual([true, true, true, true, true, true]);
  });

  it('does not use Webpack-only TypeScript checking in React Vite', () => {
    expect.hasAssertions();

    expect(main).not.toMatch(/typescript:\s*\{[\s\S]{0,200}check:\s*true/);
  });

  it('configures GFM support for MDX tables', () => {
    expect.hasAssertions();

    expect(allDependencies).toHaveProperty('remark-gfm');
    expect(main).toMatch(/import\s+remarkGfm\s+from\s+['"]remark-gfm['"]/);
    expect(main).toMatch(/remarkPlugins:\s*\[\s*remarkGfm\s*\]/);
  });

  it('enables Autodocs once at project level', () => {
    expect.hasAssertions();

    expect(preview).toMatch(/tags:\s*\[\s*['"]autodocs['"]\s*\]/);
    expect(preview).not.toContain('expectedAddonDocsConfig');
    expect(preview).not.toMatch(/docs:\s*\{[\s\S]{0,120}autodocs:/);
  });

  it('does not repeat inherited Autodocs or obsolete docs tags in stories', () => {
    expect.hasAssertions();

    const invalidStoryTags = storyFiles.flatMap(({ path, contents }) => {
      const matches = contents.matchAll(/tags:\s*\[([^\]]*)\]/g);

      return [...matches]
        .filter((match) => {
          const tags = match[1] ?? '';
          return /['"]autodocs['"]/.test(tags) || /['"]docs['"]/.test(tags);
        })
        .map(() => path);
    });

    expect(invalidStoryTags).toStrictEqual([]);
  });

  it('enables Code Panel and shares automatic source configuration', () => {
    expect.hasAssertions();

    expect(preview).toMatch(/codePanel:\s*true/);
    expect(preview).toMatch(/excludeDecorators:\s*true/);
    expect(preview).toMatch(/type:\s*['"]auto['"]/);
    expect(preview).not.toMatch(/sourceState:\s*['"]shown['"]/);
    expect(preview).not.toContain('hideNoControlsWarning');
  });

  it('uses the current MSW preview addon without legacy parameters', () => {
    expect.hasAssertions();

    const legacyMswParameters = storyFiles.filter(({ contents }) =>
      /parameters:\s*\{[\s\S]{0,800}?\bmsw\s*:/.test(contents),
    );

    expect([
      !/['"]msw-storybook-addon['"]/.test(main),
      /import\s+addonMsw\s+from\s+['"]msw-storybook-addon['"]/.test(preview),
      /definePreview\s*\(/.test(preview),
      !preview.includes('mswLoader'),
      tsconfigJson.compilerOptions?.types?.includes(
        'msw-storybook-addon/types',
      ),
      legacyMswParameters.length === 0,
    ]).toStrictEqual([true, true, true, true, true, true]);
  });

  it('references public font assets at Vite root URLs', () => {
    expect.hasAssertions();

    expect(previewHead).toContain('href="/fonts/fonts.css"');
    expect(previewHead).toContain('href="/fonts/nmi-iconfonts.css"');
    expect(preview).not.toContain('ClientApp/public/fonts');
  });

  it('composes the Docs preview annotations required by definePreview', () => {
    expect.hasAssertions();

    expect(preview).toMatch(
      /import\s+addonDocs\s+from\s+['"]@storybook\/addon-docs['"]/,
    );
    expect(preview).toMatch(/addons:\s*\[[\s\S]*addonDocs\(\)/);
  });

  it('keeps preview mocks in the canonical portal harness', () => {
    expect.hasAssertions();

    expect(preview).not.toContain('storybookMocks');
    expect(existsSync('.storybook/storybookMocks.ts')).toBe(false);
  });

  it('does not replace inferred component descriptions globally', () => {
    expect.hasAssertions();

    expect(preview).not.toContain(
      'Component documentation generated from JSDoc comments and Storybook autodocs.',
    );
  });

  it('does not clone Storybook default Autodocs template', () => {
    expect.hasAssertions();

    expect(preview).not.toContain('autoDocsTemplate');
    expect(existsSync('.storybook/preview-docs.ts')).toBe(false);
  });

  it('teaches the correct Autodocs tag and opt-out mechanism', () => {
    expect.hasAssertions();

    expect(componentDocsGuide).not.toMatch(
      /(?:add|added|adding)\s+the\s+['"]docs['"]\s+tag.*autodocs/i,
    );

    expect(componentDocsGuide).toContain('autodocs');
    expect(componentDocsGuide).toContain('!autodocs');
  });

  it('detects the singular stale docs-tag instruction', () => {
    expect.hasAssertions();

    expect(
      removedArchitecturePatterns[0]?.pattern.test(
        "Add the 'docs' tag to enable Autodocs.",
      ),
    ).toBe(true);
  });

  it('keeps every standing guidance document free of removed architecture', () => {
    expect.hasAssertions();

    const offences = standingGuidanceDocuments.flatMap(({ path, contents }) => {
      return removedArchitecturePatterns
        .filter(({ pattern }) => pattern.test(contents))
        .map(({ label }) => `${path}: ${label}`);
    });

    expect(offences).toStrictEqual([]);
  });

  it('documents the Storybook metadata responsibilities', () => {
    expect.hasAssertions();

    expect([
      /\bArgs\b/.test(componentDocsGuide),
      /\bArgTypes\b/.test(componentDocsGuide),
      /\bParameters\b/.test(componentDocsGuide),
      /\bCode Panel\b/.test(componentDocsGuide),
      /\bDoc Blocks\b/.test(componentDocsGuide),
      /\bMDX\b/.test(componentDocsGuide),
    ]).toStrictEqual([true, true, true, true, true, true]);
  });

  it('documents configuration ownership, current MSW setup, and exact gates', () => {
    expect.hasAssertions();

    expect([
      componentDocsGuide.includes('definePreview'),
      componentDocsGuide.includes('addonMsw'),
      componentDocsGuide.includes('beforeEach'),
      componentDocsGuide.includes('msw.use'),
      componentDocsGuide.includes('npm run type-check'),
      componentDocsGuide.includes('npm run test:storybook'),
      componentDocsGuide.includes('npm run storybook:verify:docs'),
    ]).toStrictEqual([true, true, true, true, true, true, true]);
  });

  it('limits strict docgen verification to reusable component stories', () => {
    expect.hasAssertions();

    expect(docsVerifier).toContain('./ClientApp/src/components/');
    expect(docsVerifier).toContain('reusableComponents');
    expect(docsVerifier).toContain('staleAcceptedDocgenExceptions');
    expect(componentDocsGuide).toContain(
      'Reusable components with public props',
    );
    expect(componentDocsGuide).toContain('Route and page stories');
  });

  it('keeps status guidance independent of transient test totals', () => {
    expect.hasAssertions();

    expect(introduction).not.toMatch(/\b\d+\s+passed\b/i);
    expect(introduction).toContain('npm run test:storybook');
  });

  it('keeps documented NMI brand colours aligned with SCSS tokens', () => {
    expect.hasAssertions();

    const colourTokens = [
      {
        token: 'nmi-primary',
        scssPattern: /\$nmi-primary:\s*(#[0-9a-f]{6})/i,
        documentedPattern: /\(\$nmi-primary\)'\s*:\s*'(#[0-9a-f]{6})'/i,
      },
      {
        token: 'nmi-header-primary',
        scssPattern: /\$nmi-header-primary:\s*(#[0-9a-f]{6})/i,
        documentedPattern: /\(\$nmi-header-primary\)'\s*:\s*'(#[0-9a-f]{6})'/i,
      },
    ];

    for (const { token, scssPattern, documentedPattern } of colourTokens) {
      const scssValue = scssPattern.exec(scssVariables)?.[1];
      const documentedValue = documentedPattern.exec(styleGuide)?.[1];

      expect(scssValue, `SCSS value for $${token}`).toBeDefined();
      expect(documentedValue, `documented value for $${token}`).toBeDefined();
      expect(documentedValue?.toLowerCase()).toBe(scssValue?.toLowerCase());
    }
  });
});
