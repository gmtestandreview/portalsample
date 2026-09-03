import {existsSync, readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';

const repositoryRoot = path.resolve(__dirname, '../../..');
const componentsRoot = path.join(repositoryRoot, 'ClientApp/src/components');

const evaluationDirectories = [
    'AriaComponents',
    'Breadcrumb/AriaBreadcrumb',
    'Buttons/AriaButton',
    'Calendar',
    'ColorArea',
    'ColorField',
    'ColorPicker',
    'ColorSlider',
    'ColorSwatch',
    'ColorThumb',
    'ColorWheel',
    'ComboBox',
    'CommandPalette',
    'Dialog',
    'Disclosure',
    'DisclosureGroup',
    'DropZone',
    'GridLists',
    'Inputs/AriaCheckbox',
    'Inputs/AriaDateField',
    'Inputs/AriaDatePicker',
    'Inputs/AriaDateRangePicker',
    'Inputs/AriaInputGroup',
    'forms/AriaForm',
].map((directory) => path.join(componentsRoot, directory));

function collectFiles(directory: string): string[] {
    return readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
        const entryPath = path.join(directory, entry.name);
        return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
    });
}

const evaluationFiles = evaluationDirectories.flatMap(collectFiles);
const storyFiles = evaluationFiles.filter((file) => file.endsWith('.stories.tsx'));
const sourceFiles = evaluationFiles.filter(
    (file) =>
        /\.(?:css|ts|tsx)$/.test(file) &&
        !/(?:\.stories copy\.tsx|\/main\.tsx|\\main\.tsx|setup(?:Browser)?Tests\.ts|testStyleMock\.ts)$/.test(
            file,
        ),
);

function findRelativeImports(file: string): string[] {
    const source = readFileSync(file, 'utf8');
    const patterns = [
        /\bfrom\s+['"](\.[^'"]+)['"]/g,
        /\bimport\s+['"](\.[^'"]+)['"]/g,
        /@import\s+['"](\.[^'"]+)['"]/g,
    ];

    return patterns.flatMap((pattern) =>
        [...source.matchAll(pattern)].map((match) => match[1]),
    );
}

function importResolves(importer: string, specifier: string): boolean {
    const basePath = path.resolve(path.dirname(importer), specifier);
    return [
        basePath,
        `${basePath}.ts`,
        `${basePath}.tsx`,
        `${basePath}.css`,
        path.join(basePath, 'index.ts'),
        path.join(basePath, 'index.tsx'),
    ].some(existsSync);
}

describe('React Aria Storybook evaluation contract', () => {
    test('keeps all 48 reusable component stories discoverable and isolated', () => {
        expect(storyFiles).toHaveLength(48);

        for (const file of storyFiles) {
            const source = readFileSync(file, 'utf8');
            expect(source, file).toContain("from '@storybook/react-vite'");
            expect(source, file).toMatch(
                /title:\s*['"]Evaluation\/React Aria\//,
            );
            expect(source, file).toContain('satisfies Meta');
            expect(source, file).not.toContain('../src/');
            expect(source, file).not.toContain("from '@storybook/react'");
        }
    });

    test('uses NMI icons rather than Lucide in the first-instance evaluation', () => {
        for (const file of sourceFiles.filter((file) => /\.tsx?$/.test(file))) {
            expect(readFileSync(file, 'utf8'), file).not.toContain('lucide-react');
        }
    });

    test('resolves every relative import in the reusable evaluation surface', () => {
        const unresolved = sourceFiles.flatMap((file) =>
            findRelativeImports(file)
                .filter((specifier) => !importResolves(file, specifier))
                .map((specifier) => `${path.relative(repositoryRoot, file)} -> ${specifier}`),
        );

        expect(unresolved).toEqual([]);
    });

    test('scopes React Aria theme variables to the evaluation surface', () => {
        const themeFile = path.join(componentsRoot, 'AriaComponents/theme.css');
        const source = readFileSync(themeFile, 'utf8');

        expect(source).toContain('.react-aria-evaluation');
        expect(source).not.toMatch(/(^|[\s,]):root\b/m);
    });

    test('type-checks the evaluation surface with no demo-only carve-outs', () => {
        // The three excludes that stood here carved live directories out of the
        // TypeScript program to hide a broken scaffold. `components/App` never
        // existed, `AriaComponents/main.tsx` imported an absent `App.tsx`, and
        // `reactaria_components/AlertMessage.tsx` imported an absent
        // `ClientApp/src/Content`. The scaffold is kept and repaired, so the
        // carve-outs are gone and `tsc --noEmit` covers it like any other source.
        const tsconfig = readFileSync(path.join(repositoryRoot, 'tsconfig.json'), 'utf8');

        expect(tsconfig).not.toContain('ClientApp/src/components/App/**');
        expect(tsconfig).not.toContain('ClientApp/src/components/AriaComponents/main.tsx');
        expect(tsconfig).not.toContain('ClientApp/src/components/reactaria_components/**');
    });

    test('keeps the retained reactaria_components scaffold import-resolvable', () => {
        const scaffoldRoot = path.join(componentsRoot, 'reactaria_components');
        const scaffoldSources = collectFiles(scaffoldRoot).filter((file) =>
            /\.tsx?$/.test(file),
        );

        expect(scaffoldSources.length).toBeGreaterThan(0);

        const unresolved = scaffoldSources.flatMap((file) =>
            findRelativeImports(file)
                .filter((specifier) => !importResolves(file, specifier))
                .map((specifier) => `${path.relative(repositoryRoot, file)} -> ${specifier}`),
        );

        expect(unresolved).toEqual([]);
    });

    test('removes the dead AriaComponents entry point', () => {
        expect(
            existsSync(path.join(componentsRoot, 'AriaComponents/main.tsx')),
        ).toBe(false);
    });
});
