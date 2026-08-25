import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const staticDir = resolve(root, 'storybook-static');

const requiredFiles = ['index.html', 'iframe.html', 'index.json'];

for (const file of requiredFiles) {
    await access(resolve(staticDir, file));
}

const index = JSON.parse(
    await readFile(resolve(staticDir, 'index.json'), 'utf8'),
);

const entries = Object.values(index.entries ?? {});

if (entries.length === 0) {
    throw new Error('Storybook index contains no entries.');
}

const docsEntries = entries.filter((entry) => entry.type === 'docs');
const storyEntries = entries.filter((entry) => entry.type === 'story');

if (docsEntries.length === 0) {
    throw new Error('Storybook index contains no documentation entries.');
}

if (storyEntries.length === 0) {
    throw new Error('Storybook index contains no story entries.');
}

const hasDocumentationSection = docsEntries.some((entry) =>
    String(entry.title ?? '').startsWith('Documentation/'),
);

if (!hasDocumentationSection) {
    throw new Error('Expected at least one standalone Documentation/* MDX entry.');
}

console.log(
    JSON.stringify(
        {
            totalEntries: entries.length,
            docsEntries: docsEntries.length,
            storyEntries: storyEntries.length,
            documentationSection: hasDocumentationSection,
        },
        null,
        2,
    ),
);
