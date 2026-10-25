import { describe, expect, it } from 'vitest';

import {
  type ApplicationAndInstrumentStep,
  type ApplicationAndInstrumentStepDto,
  PatternApprovalRequiredValueOptions,
  PatternApprovalRequiredValues,
} from '../../../../ClientApp/src/api/web-api-client';

import { DisplayRules } from '../../../../ClientApp/src/routes/ta/displayRules';

type InstrumentTypeContent = NonNullable<
  ApplicationAndInstrumentStepDto['instrumentTypeContent']
>[number];

type DtoOverrides = Omit<
  Partial<ApplicationAndInstrumentStepDto>,
  'newSubOptions' | 'instrumentTypeContent'
> & {
  readonly newSubOptions?:
    ApplicationAndInstrumentStepDto['newSubOptions'] | undefined;
  readonly instrumentTypeContent?:
    ApplicationAndInstrumentStepDto['instrumentTypeContent'] | undefined;
};

const content = (
  overrides: Partial<InstrumentTypeContent> = {},
): InstrumentTypeContent =>
  ({
    instrumentTypeId: 'type-1',
    instrumentCategoryId: 'category-1',
    eligibleForOiml: true,
    ...overrides,
  }) as InstrumentTypeContent;

const dto = (
  overrides: DtoOverrides = {},
): Partial<ApplicationAndInstrumentStepDto> => {
  const { newSubOptions, instrumentTypeContent, ...otherOverrides } = overrides;
  const result: Partial<ApplicationAndInstrumentStepDto> = {
    instrumentCategory: 'category-1',
    instrumentType: 'type-1',
    newSubOptions: [PatternApprovalRequiredValueOptions.OIMLCertificate],
    instrumentTypeContent: [content()],
    ...otherOverrides,
    ...(newSubOptions === undefined ? {} : { newSubOptions }),
    ...(instrumentTypeContent === undefined ? {} : { instrumentTypeContent }),
  };

  if ('newSubOptions' in overrides && overrides.newSubOptions === undefined) {
    delete result.newSubOptions;
  }
  if (
    'instrumentTypeContent' in overrides &&
    overrides.instrumentTypeContent === undefined
  ) {
    delete result.instrumentTypeContent;
  }

  return result;
};

const step = (
  patternApprovalType?: PatternApprovalRequiredValues,
): ApplicationAndInstrumentStep =>
  ({ patternApprovalType }) as ApplicationAndInstrumentStep;

describe('displayRules.isOIMLHiddenP', () => {
  it('hides the OIML option when the sub-option is not ticked', () => {
    expect.assertions(1);
    const result = DisplayRules.isOIMLHiddenP(dto({ newSubOptions: [] }));

    expect(result).toBe(true);
  });
});

describe('displayRules.isOIMLHiddenP', () => {
  it('treats an absent sub-option list as ticked and falls through to content', () => {
    expect.assertions(1);
    const result = DisplayRules.isOIMLHiddenP(
      dto({ newSubOptions: undefined, instrumentTypeContent: undefined }),
    );

    // No content can be resolved, so eligibility cannot be determined.
    expect(result).toBe(true);
  });
});

describe('displayRules.isOIMLHiddenP', () => {
  it('hides the option when no content matches the selected type and category', () => {
    expect.assertions(1);
    const result = DisplayRules.isOIMLHiddenP(
      dto({
        instrumentTypeContent: [
          content({ instrumentTypeId: 'a-different-type' }),
        ],
      }),
    );

    expect(result).toBe(true);
  });
});

describe('displayRules.isOIMLHiddenP', () => {
  it('requires both the type and the category to match before using content', () => {
    expect.assertions(1);
    const result = DisplayRules.isOIMLHiddenP(
      dto({
        instrumentTypeContent: [
          content({ instrumentCategoryId: 'a-different-category' }),
        ],
      }),
    );

    expect(result).toBe(true);
  });
});

describe('displayRules.isOIMLHiddenP', () => {
  it('reports hidden for matching content that is eligible for OIML', () => {
    expect.assertions(1);
    const result = DisplayRules.isOIMLHiddenP(
      dto({ instrumentTypeContent: [content({ eligibleForOiml: true })] }),
    );

    expect(result).toBe(true);
  });
});
