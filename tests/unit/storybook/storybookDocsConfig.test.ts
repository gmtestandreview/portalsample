import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");

const main = read(".storybook/main.ts");
const preview = read(".storybook/preview.ts");
const componentDocsGuide = read(".storybook/component-docs-guide.mdx");
const introduction = read(".storybook/introduction.mdx");
const styleGuide = read(".storybook/style-guide.mdx");
const scssVariables = read("ClientApp/src/styles/_variables.scss");
const docsVerifier = read("scripts/verify-storybook-docs.mjs");
const tsconfigJson = ts.parseConfigFileTextToJson(
  "tsconfig.json",
  read("tsconfig.json"),
).config as { compilerOptions?: { types?: string[] } };
const packageJson = JSON.parse(read("package.json")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const allDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

const declaredVersion = (packageName: string) =>
  allDependencies[packageName]?.replace(/^[~^]/, "");

const storyFiles = readdirSync(resolve(repoRoot, "ClientApp/src"), {
  recursive: true,
  withFileTypes: true,
})
  .filter(
    (entry) => entry.isFile() && /\.stories\.[cm]?[jt]sx?$/.test(entry.name),
  )
  .map((entry) => resolve(entry.parentPath, entry.name));

const toRepoPath = (absolutePath: string) =>
  absolutePath.slice(repoRoot.length + 1).replace(/\\/g, "/");

/**
 * Directories that record what the documentation architecture *was* — baselines,
 * change records, plans, and review notes. They legitimately quote the removed
 * configuration as evidence, so they are history rather than standing guidance.
 */
const historicalRecordPaths = [
  "docs/change-record/",
  "docs/migration/",
  "docs/qa/",
  "docs/sprint-1/",
  "docs/superpowers/",
  "docs/storybook/storybook-refactor-baseline.md",
];

/**
 * Every document a developer could reasonably read as current instruction on how
 * to write Storybook documentation in this repository.
 */
const standingGuidanceDocuments = [
  ...readdirSync(resolve(repoRoot, "docs"), {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => toRepoPath(resolve(entry.parentPath, entry.name))),
  ...readdirSync(resolve(repoRoot, ".storybook"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => toRepoPath(resolve(entry.parentPath, entry.name))),
].filter(
  (path) => !historicalRecordPaths.some((prefix) => path.startsWith(prefix)),
);

/**
 * Architecture this refactor removed. Any standing guidance still teaching one of
 * these sends developers to a configuration the repository no longer has.
 */
const removedArchitecturePatterns: { label: string; pattern: RegExp }[] = [
  {
    label: "'docs' tag taught as the Autodocs trigger",
    pattern: /add(?:ed|ing)?\s+(?:the\s+)?['"`]docs['"`]\s+tag/i,
  },
  {
    label: "'docs' listed in a story tags array",
    pattern: /tags:\s*\[[^\]]*['"]docs['"]/,
  },
  {
    label: "addon-level autodocs option",
    pattern: /autodocs:\s*['"]tag['"]/,
  },
  {
    label: "removed canvas sourceState",
    pattern: /sourceState:\s*['"]shown['"]/,
  },
  {
    label: "removed generic global component description",
    pattern:
      /Component documentation generated from JSDoc comments and Storybook autodocs/,
  },
  {
    label: "removed cloned Autodocs template",
    pattern: /autoDocsTemplate/,
  },
  {
    label: "removed Webpack-only styling addon",
    pattern: /@storybook\/addon-styling-webpack/,
  },
];

describe("Storybook documentation architecture", () => {
  it("keeps main.ts syntactically valid", () => {
    const result = ts.transpileModule(main, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ESNext,
      },
      fileName: ".storybook/main.ts",
      reportDiagnostics: true,
    });
    const syntaxErrors = (result.diagnostics ?? [])
      .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));

    expect(syntaxErrors).toEqual([]);
  });

  it("uses the audited latest stable Storybook package set", () => {
    const storybookPackages = [
      "storybook",
      "@storybook/react-vite",
      "@storybook/addon-a11y",
      "@storybook/addon-docs",
      "@storybook/addon-links",
      "@storybook/addon-vitest",
      "eslint-plugin-storybook",
    ];

    for (const packageName of storybookPackages) {
      expect(declaredVersion(packageName), packageName).toBe("10.5.10");
    }

    expect(declaredVersion("@storybook/addon-mcp")).toBe("0.7.0");
    expect(declaredVersion("@chromatic-com/storybook")).toBe("5.3.0");
    expect(declaredVersion("msw-storybook-addon")).toBe("3.0.0");
  });

  it("uses React Vite without obsolete or unused Storybook addons", () => {
    expect(main).toMatch(/framework:\s*["']@storybook\/react-vite["']/);
    expect(main).not.toContain("@storybook/addon-styling-webpack");
    expect(allDependencies).not.toHaveProperty(
      "@storybook/addon-styling-webpack",
    );
    expect(allDependencies).not.toHaveProperty("@storybook/addon-onboarding");
    expect(allDependencies).not.toHaveProperty("@storybook/addon-designs");
  });

  it("keeps Vite customization limited to required Sass compatibility", () => {
    expect(main).toContain("quietDeps: true");
    expect(main).toContain("silenceDeprecations:");
    expect(main).not.toContain("rolldownOptions");
    expect(main).not.toContain("chunkSizeWarningLimit");
    expect(main).not.toContain("getNodeModulesPackageName");
    expect(main).not.toContain("getPackageSubArea");
  });

  it("uses non-overlapping canonical story and MDX globs", () => {
    expect(main).toMatch(/["']\.\.\/\.storybook\/\*\.mdx["']/);
    expect(main).toMatch(/["']\.\.\/ClientApp\/src\/\*\*\/\*\.mdx["']/);
    expect(main).toMatch(
      /["']\.\.\/ClientApp\/src\/\*\*\/\*\.stories\.@\(js\|jsx\|mjs\|ts\|tsx\)["']/,
    );

    expect(main).not.toContain("'../ClientApp/src/**/*.stories.@(ts|tsx)'");
    expect(main).not.toContain("'../ClientApp/src/**/*.{docs,Docs}.mdx'");
  });

  it("owns generated docs naming and docs mode in main.ts", () => {
    expect(main).toMatch(
      /docs:\s*\{[\s\S]*defaultName:\s*['"]Documentation['"]/,
    );
    expect(main).toMatch(/docs:\s*\{[\s\S]*docsMode:\s*false/);
    expect(main.match(/defaultName:/g)).toHaveLength(1);
    expect(main.match(/docsMode:/g)).toHaveLength(1);
    expect(main).not.toMatch(/autodocs:\s*['"]tag['"]/);
    expect(main).not.toMatch(/docsMode:\s*true/);
  });

  it("does not use Webpack-only TypeScript checking in React Vite", () => {
    expect(main).not.toMatch(/typescript:\s*\{[\s\S]{0,200}check:\s*true/);
  });

  it("configures GFM support for MDX tables", () => {
    expect(allDependencies).toHaveProperty("remark-gfm");
    expect(main).toMatch(/import\s+remarkGfm\s+from\s+['"]remark-gfm['"]/);
    expect(main).toMatch(/remarkPlugins:\s*\[\s*remarkGfm\s*\]/);
  });

  it("enables Autodocs once at project level", () => {
    expect(preview).toMatch(/tags:\s*\[\s*['"]autodocs['"]\s*\]/);
    expect(preview).not.toContain("expectedAddonDocsConfig");
    expect(preview).not.toMatch(/docs:\s*\{[\s\S]{0,120}autodocs:/);
  });

  it("does not repeat inherited Autodocs or obsolete docs tags in stories", () => {
    const invalidStoryTags = storyFiles.flatMap((path) => {
      const matches = readFileSync(path, "utf8").matchAll(
        /tags:\s*\[([^\]]*)\]/g,
      );

      return [...matches]
        .filter((match) => {
          const tags = match[1] ?? "";
          return /['"]autodocs['"]/.test(tags) || /['"]docs['"]/.test(tags);
        })
        .map(() => path.replace(`${repoRoot}\\`, ""));
    });

    expect(invalidStoryTags).toEqual([]);
  });

  it("enables Code Panel and shares automatic source configuration", () => {
    expect(preview).toMatch(/codePanel:\s*true/);
    expect(preview).toMatch(/excludeDecorators:\s*true/);
    expect(preview).toMatch(/type:\s*['"]auto['"]/);
    expect(preview).not.toMatch(/sourceState:\s*['"]shown['"]/);
    expect(preview).not.toContain("hideNoControlsWarning");
  });

  it("uses the current MSW preview addon without legacy parameters", () => {
    expect(main).not.toMatch(/['"]msw-storybook-addon['"]/);
    expect(preview).toMatch(/import\s+addonMsw\s+from\s+['"]msw-storybook-addon['"]/);
    expect(preview).toMatch(/definePreview\s*\(/);
    expect(preview).not.toContain("mswLoader");
    expect(tsconfigJson.compilerOptions?.types).toContain(
      "msw-storybook-addon/types",
    );

    const legacyMswParameters = storyFiles.filter((path) =>
      /parameters:\s*\{[\s\S]{0,800}?\bmsw\s*:/.test(readFileSync(path, "utf8")),
    );

    expect(legacyMswParameters.map(toRepoPath)).toEqual([]);
  });

  it("composes the Docs preview annotations required by definePreview", () => {
    expect(preview).toMatch(
      /import\s+addonDocs\s+from\s+['"]@storybook\/addon-docs['"]/,
    );
    expect(preview).toMatch(/addons:\s*\[[\s\S]*addonDocs\(\)/);
  });

  it("keeps preview mocks in the canonical portal harness", () => {
    expect(preview).not.toContain("storybookMocks");
    expect(existsSync(resolve(repoRoot, ".storybook/storybookMocks.ts"))).toBe(false);
  });

  it("does not replace inferred component descriptions globally", () => {
    expect(preview).not.toContain(
      "Component documentation generated from JSDoc comments and Storybook autodocs.",
    );
  });

  it("does not clone Storybook default Autodocs template", () => {
    expect(preview).not.toContain("autoDocsTemplate");
    expect(existsSync(resolve(repoRoot, ".storybook/preview-docs.ts"))).toBe(
      false,
    );
  });

  it("teaches the correct Autodocs tag and opt-out mechanism", () => {
    expect(componentDocsGuide).not.toMatch(/Adding the ['"]docs['"] Tag/i);
    expect(componentDocsGuide).not.toMatch(
      /add(?:ing)? the ['"]docs['"] tag.*autodocs/i,
    );

    expect(componentDocsGuide).toContain("autodocs");
    expect(componentDocsGuide).toContain("!autodocs");
  });

  it("keeps every standing guidance document free of removed architecture", () => {
    const offences = standingGuidanceDocuments.flatMap((path) => {
      const contents = read(path);

      return removedArchitecturePatterns
        .filter(({ pattern }) => pattern.test(contents))
        .map(({ label }) => `${path}: ${label}`);
    });

    expect(offences).toEqual([]);
  });

  it("documents the Storybook metadata responsibilities", () => {
    expect(componentDocsGuide).toMatch(/\bArgs\b/);
    expect(componentDocsGuide).toMatch(/\bArgTypes\b/);
    expect(componentDocsGuide).toMatch(/\bParameters\b/);
    expect(componentDocsGuide).toMatch(/\bCode Panel\b/);
    expect(componentDocsGuide).toMatch(/\bDoc Blocks\b/);
    expect(componentDocsGuide).toMatch(/\bMDX\b/);
  });

  it("documents configuration ownership, current MSW setup, and exact gates", () => {
    expect(componentDocsGuide).toContain("definePreview");
    expect(componentDocsGuide).toContain("addonMsw");
    expect(componentDocsGuide).toContain("beforeEach");
    expect(componentDocsGuide).toContain("msw.use");
    expect(componentDocsGuide).toContain("npm run type-check");
    expect(componentDocsGuide).toContain("npm run test:storybook");
    expect(componentDocsGuide).toContain("npm run storybook:verify:docs");
  });

  it("limits strict docgen verification to reusable component stories", () => {
    expect(docsVerifier).toContain("./ClientApp/src/components/");
    expect(docsVerifier).toContain("reusableComponents");
    expect(docsVerifier).toContain("staleAcceptedDocgenExceptions");
    expect(componentDocsGuide).toContain("Reusable components with public props");
    expect(componentDocsGuide).toContain("Route and page stories");
  });

  it("keeps status guidance independent of transient test totals", () => {
    expect(introduction).not.toMatch(/\b\d+\s+passed\b/i);
    expect(introduction).toContain("npm run test:storybook");
  });

  it("keeps documented NMI brand colours aligned with SCSS tokens", () => {
    for (const token of ["nmi-primary", "nmi-header-primary"]) {
      const scssValue = new RegExp(`\\$${token}:\\s*(#[0-9a-f]{6})`, "i").exec(
        scssVariables,
      )?.[1];
      const documentedValue = new RegExp(
        `\\(\\$${token}\\)'\\s*:\\s*'(#[0-9a-f]{6})'`,
        "i",
      ).exec(styleGuide)?.[1];

      expect(scssValue, `SCSS value for $${token}`).toBeDefined();
      expect(documentedValue, `documented value for $${token}`).toBeDefined();
      expect(documentedValue?.toLowerCase()).toBe(scssValue?.toLowerCase());
    }
  });
});
