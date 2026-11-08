import assert from 'node:assert/strict';
import test from 'node:test';
import packageJson from '../package.json' with { type: 'json' };

const { scripts } = packageJson;

test('canonical validation workflows are present', () => {
  for (const scriptName of [
    'check',
    'verify:vite',
    'test:script-contract',
    'test:all',
    'test:e2e:browser',
  ]) {
    assert.ok(Object.hasOwn(scripts, scriptName), `${scriptName} must exist`);
  }
});

test('canonical commands do not retain redundant aliases', () => {
  assert.equal(
    scripts['test:all'],
    'npm run check && npm run test:unit:coverage && npm run test:storybook && npm run build && npm run verify:vite && npm run test:quality:regression && npm run test:e2e && npm run test:api-contract',
  );
  for (const removedAlias of [
    'start',
    'format:source',
    'format:source:check',
    'test:unit-and-storybook',
    'build-storybook-docs',
    'storybook-docs',
    'test:bdd',
    'test:bdd:ui',
  ]) {
    assert.equal(
      Object.hasOwn(scripts, removedAlias),
      false,
      `${removedAlias} should not be retained as a duplicate alias`,
    );
  }
});

test('full E2E retains the release closure contract', () => {
  assert.equal(
    scripts['test:e2e'],
    'npm run test:e2e:browser && npm run test:storybook:coverage',
  );
  assert.match(scripts['test:e2e:browser'], /test:e2e:app/);
  assert.match(scripts['test:e2e:browser'], /build-storybook/);
  assert.match(scripts['test:e2e:browser'], /test:e2e:storybook/);
});

test('aggregate checks include the repository quality gates', () => {
  for (const scriptName of [
    'type-check',
    'lint',
    'lint:mdx',
    'lint:rules',
    'validate:json',
  ]) {
    assert.ok(
      scripts.check.includes(`npm run ${scriptName}`),
      `check must include npm run ${scriptName}`,
    );
  }
});
