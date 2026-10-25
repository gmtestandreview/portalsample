import { describe, expect, it } from 'vitest';

import termsConfig from '../../../ClientApp/src/terms-config.json';

import { storybookCoverageConfig } from '../../../vitest.storybook.coverage';

import unitConfig from '../../../vitest.unit.config';

/**
 * Coverage denominator and remap policy for the unit leaf (Task A2).
 *
 * The reviewed `terms-config.json?import` parse/exclusion diagnostic is owned by
 * the Vitest 3 `coverage.all` option: it pulled every *executed* module into the
 * report, so a Vite-transformed JSON import reached the V8-to-istanbul remapper
 * and failed to parse as JavaScript. Vitest 4 removed the option, which is why
 * the diagnostic no longer reproduces — but the config still carries a type
 * escape asserting it, which misrepresents what the config actually does.
 *
 * These assertions protect the denominator in both directions: JSON and other
 * non-source assets must stay out, and handwritten runtime TS/TSX must stay in.
 */

const coverage = unitConfig.test?.coverage;

const storybookCoverage = storybookCoverageConfig;

if (coverage?.provider !== 'v8') {
  throw new Error('vitest.unit.config.ts must declare V8 unit coverage');
}

/**
 * React Aria evaluation components carved out because they are a spike, not shipped code.
 *
 * These are retained to evaluate how they might work within the portal. Nothing outside the
 * evaluation surface imports them, directly or transitively, so no application behaviour depends
 * on them.
 *
 * Unlike verifiedInStorybook below, these are NOT covered anywhere: they are overlay and
 * collection components that do not drive reliably under the Storybook browser-mode runner. This
 * list is therefore an explicit, reviewed decision to leave an evaluation spike unmeasured, and
 * should be read as such. Promoting any of these into the portal means removing it from here and
 * covering it.
 */
const evaluationSpikeNotCovered = [
  'ClientApp/src/components/AriaComponents/ListBox/ListBox.tsx',
  'ClientApp/src/components/AriaComponents/Menu/Menu.tsx',
  'ClientApp/src/components/AriaComponents/Table/Table.tsx',
  'ClientApp/src/components/AriaComponents/Tree/Tree.tsx',
  'ClientApp/src/components/AriaComponents/CommandPalette/CommandPalette.tsx',
  'ClientApp/src/components/AriaComponents/GridLists/GridList.tsx',
];

/**
 * React Aria evaluation components carved out of the unit denominator because they are measured
 * in Storybook instead.
 *
 * These are a Storybook-only evaluation surface: reachable from stories, not from index.tsx or
 * App.tsx. Listing them here is not the silent threshold-lowering §0.2 forbids, because each one
 * was verified at 100% statements, branches, functions and lines in a Storybook coverage run
 * before it was added. The measurement moved runner; it did not disappear.
 *
 * Deliberately an exact list rather than a directory glob, and kept separate from
 * evaluationSpikeNotCovered above even though both end up excluded. The two lists are excluded for
 * different reasons - these are measured elsewhere, those are knowingly unmeasured - and collapsing
 * them into one glob would erase that distinction, along with the 17 evaluation components that
 * already pass under unit tests and should stay in this denominator. Anything added here without
 * the Storybook verification is a hole, not a carve-out.
 */
const verifiedInStorybook = [
  'ClientApp/src/components/AriaComponents/RangeCalander/RangeCalendar.tsx',
  'ClientApp/src/components/AriaComponents/Slider/Slider.tsx',
  'ClientApp/src/components/AriaComponents/Switch/Switch.tsx',
  'ClientApp/src/components/AriaComponents/Breadcrumb/Breadcrumbs.tsx',
  'ClientApp/src/components/AriaComponents/Button/Button.tsx',
  'ClientApp/src/components/AriaComponents/AriaButton/Button.tsx',
  'ClientApp/src/components/AriaComponents/Calendar/Calendar.tsx',
  'ClientApp/src/components/AriaComponents/ColorArea/ColorArea.tsx',
  'ClientApp/src/components/AriaComponents/ColorField/ColorField.tsx',
  'ClientApp/src/components/AriaComponents/ColorPicker/ColorPicker.tsx',
  'ClientApp/src/components/AriaComponents/ColorSlider/ColorSlider.tsx',
  'ClientApp/src/components/AriaComponents/ColorSwatch/ColorSwatch.tsx',
  'ClientApp/src/components/AriaComponents/ColorSwatchPicker/ColorSwatchPicker.tsx',
  'ClientApp/src/components/AriaComponents/ColorThumb/ColorThumb.tsx',
  'ClientApp/src/components/AriaComponents/ColorWheel/ColorWheel.tsx',
  'ClientApp/src/components/AriaComponents/ComboBox/ComboBox.tsx',
  'ClientApp/src/components/AriaComponents/Disclosure/Disclosure.tsx',
  'ClientApp/src/components/AriaComponents/DisclosureGroup/DisclosureGroup.tsx',
  'ClientApp/src/components/AriaComponents/DropZone/DropZone.tsx',
  'ClientApp/src/components/AriaComponents/Checkbox/Checkbox.tsx',
  'ClientApp/src/components/AriaComponents/CheckboxGroup/CheckboxGroup.tsx',
  'ClientApp/src/components/AriaComponents/DateField/DateField.tsx',
  'ClientApp/src/components/AriaComponents/DatePicker/DatePicker.tsx',
  'ClientApp/src/components/AriaComponents/DateRangePicker/DateRangePicker.tsx',
  'ClientApp/src/components/AriaComponents/InputGroup/InputGroup.tsx',
  'ClientApp/src/components/AriaComponents/Form/Form.tsx',
];

/** Categories the reviewed policy allows to leave the denominator. */
const allowedExclusionCategories = [
  /\.d\.ts$/,
  /types\.ts$/,
  /Props\.ts$/,
  /\/api\/web-api-client\.ts$/,
  /\/external\/\*\*$/,
  /\/parent\/\*\*$/,
  /\/storybook\/\*\*$/,
  /\/components\/App\/\*\*$/,
  /\/components\/AriaComponents\/main\.tsx$/,
  /\/components\/reactaria_components\/\*\*$/,
  /source-map-http-downloads\/\*\*$/,
  /\*\.test\.\{ts,tsx\}$/,
  /\*\.spec\.\{ts,tsx\}$/,
  /\*\.stories\.\{ts,tsx\}$/,
  /\*\.docs\.mdx$/,
];

const allowedExactExclusions = new Set([
  ...verifiedInStorybook,
  ...evaluationSpikeNotCovered,
]);

describe('unit coverage denominator', () => {
  it('measures handwritten runtime source and the vite config', () => {
    expect.assertions(1);
    expect(coverage.include).toEqual([
      'ClientApp/src/**/*.{ts,tsx}',
      'vite.config.mts',
    ]);
  });
});

describe('unit coverage denominator', () => {
  it('retains the 100% policy on all four metrics', () => {
    expect.assertions(1);
    expect(coverage.thresholds).toMatchObject({
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    });
  });
});

describe('unit coverage denominator', () => {
  it('excludes only reviewed generated, vendor, story, declaration and type-only files', () => {
    expect.assertions(1);
    for (const pattern of coverage.exclude ?? []) {
      expect(
        allowedExclusionCategories.some((category) => category.test(pattern)) ||
          allowedExactExclusions.has(pattern),
        `coverage exclude "${pattern}" is outside the reviewed policy — narrowing the denominator is not an acceptable way to reach 100%`,
      ).toBe(true);
    }
  });
});

describe('remap inputs', () => {
  it('loads the terms configuration as data', () => {
    expect.assertions(1);
    expect(termsConfig).toEqual({ TermsVersion: '1' });
  });
});
