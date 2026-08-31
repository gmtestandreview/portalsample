import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

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

const manifest = JSON.parse(
    await readFile(resolve(staticDir, 'manifests/components.json'), 'utf8'),
);

const components = Object.values(manifest.components ?? {});

if (components.length === 0) {
    throw new Error('Storybook component manifest contains no components.');
}

const reusableComponentStoryPrefix = './ClientApp/src/components/';
const reusableComponents = components.filter((component) =>
    String(component.path ?? '').startsWith(reusableComponentStoryPrefix),
);

if (reusableComponents.length === 0) {
    throw new Error('Storybook component manifest contains no reusable components.');
}

/**
 * Components whose missing prop metadata is accepted, with the reason. Anything
 * not listed here must produce docgen output: a component that silently loses its
 * props documents nothing, and Autodocs gives no build error when that happens.
 */
const acceptedDocgenExceptions = new Map([
    [
        'evaluation-react-aria-toast',
        'composite example: stories coordinate a toast region and trigger rather than document one public component API',
    ],
    [
        'components-footer',
        'prop-less portal shell component whose behaviour comes from application context',
    ],
    [
        'components-header',
        'prop-less portal shell component whose behaviour comes from application context',
    ],
    [
        'components-home',
        'prop-less composition component with no public prop API',
    ],
    [
        'components-utilities-routeaccessiblenavigation',
        'prop-less accessibility utility with no public prop API',
    ],
    [
        'components-welcome',
        'prop-less composition component with no public prop API',
    ],
    [
        'forms-inputs',
        'meta.component resolves to a react-bootstrap component inside node_modules',
    ],
    [
        'routes-home-getstarted',
        'prop-less reusable composition component with no public prop API',
    ],
    [
        'modals',
        'multi-component gallery: every story renders a local wrapper or a different modal, so no single meta.component describes the page',
    ],
]);

const reusableDocgenFailureIds = new Set(
    reusableComponents
        .filter((component) => component.error)
        .map((component) => component.id),
);
const staleAcceptedDocgenExceptions = [...acceptedDocgenExceptions.keys()].filter(
    (componentId) => !reusableDocgenFailureIds.has(componentId),
);

if (staleAcceptedDocgenExceptions.length > 0) {
    throw new Error(
        `Stale accepted docgen exceptions (remove or re-audit):\n  ${staleAcceptedDocgenExceptions.join('\n  ')}`,
    );
}

const docgenFailures = reusableComponents
    .filter((component) => component.error)
    .filter((component) => !acceptedDocgenExceptions.has(component.id))
    .map(
        (component) =>
            `${component.name} (${component.id}): ${component.error.name}`,
    );

if (docgenFailures.length > 0) {
    throw new Error(
        `Components without generated prop metadata:\n  ${docgenFailures.join('\n  ')}`,
    );
}

console.warn(
    JSON.stringify(
        {
            totalEntries: entries.length,
            docsEntries: docsEntries.length,
            storyEntries: storyEntries.length,
            documentationSection: hasDocumentationSection,
            components: components.length,
            reusableComponents: reusableComponents.length,
            routeAndPageComponents: components.length - reusableComponents.length,
            acceptedDocgenExceptions: Object.fromEntries(
                acceptedDocgenExceptions,
            ),
        },
        null,
        2,
    ),
);
