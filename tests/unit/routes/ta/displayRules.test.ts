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
    overrides: Partial<ApplicationAndInstrumentStepDto> = {},
): Partial<ApplicationAndInstrumentStepDto> => ({
    instrumentCategory: 'category-1',
    instrumentType: 'type-1',
    newSubOptions: [PatternApprovalRequiredValueOptions.OIMLCertificate],
    instrumentTypeContent: [content()],
    ...overrides,
});

const step = (
    patternApprovalType?: PatternApprovalRequiredValues,
): ApplicationAndInstrumentStep =>
    ({ patternApprovalType }) as ApplicationAndInstrumentStep;

describe('DisplayRules.isOIMLHiddenP', () => {
    it('hides the OIML option when the sub-option is not ticked', () => {
        const result = DisplayRules.isOIMLHiddenP(
            dto({ newSubOptions: [] }),
        );

        expect(result).toBe(true);
    });

    it('treats an absent sub-option list as ticked and falls through to content', () => {
        const result = DisplayRules.isOIMLHiddenP(
            dto({ newSubOptions: undefined, instrumentTypeContent: undefined }),
        );

        // No content can be resolved, so eligibility cannot be determined.
        expect(result).toBe(true);
    });

    it('hides the option when no content matches the selected type and category', () => {
        const result = DisplayRules.isOIMLHiddenP(
            dto({
                instrumentTypeContent: [
                    content({ instrumentTypeId: 'a-different-type' }),
                ],
            }),
        );

        expect(result).toBe(true);
    });

    it('requires both the type and the category to match before using content', () => {
        const result = DisplayRules.isOIMLHiddenP(
            dto({
                instrumentTypeContent: [
                    content({ instrumentCategoryId: 'a-different-category' }),
                ],
            }),
        );

        expect(result).toBe(true);
    });

    it('reports hidden for matching content that is eligible for OIML', () => {
        const result = DisplayRules.isOIMLHiddenP(
            dto({ instrumentTypeContent: [content({ eligibleForOiml: true })] }),
        );

        expect(result).toBe(true);
    });

    it('reports not hidden for matching content that is ineligible for OIML', () => {
        const result = DisplayRules.isOIMLHiddenP(
            dto({
                instrumentTypeContent: [content({ eligibleForOiml: false })],
            }),
        );

        expect(result).toBe(false);
    });
});

describe('DisplayRules.isOIMLHidden', () => {
    it('hides the option when the sub-option list excludes the OIML certificate', () => {
        const result = DisplayRules.isOIMLHidden({
            newSubOptions: [
                PatternApprovalRequiredValueOptions.CertificateofApproval,
            ],
        } as ApplicationAndInstrumentStep);

        expect(result).toBe(true);
    });

    it('shows the option when the sub-option list includes the OIML certificate', () => {
        const result = DisplayRules.isOIMLHidden({
            newSubOptions: [
                PatternApprovalRequiredValueOptions.OIMLCertificate,
            ],
        } as ApplicationAndInstrumentStep);

        expect(result).toBe(false);
    });

    it('hides the option when no sub-options have been chosen', () => {
        const result = DisplayRules.isOIMLHidden({
            newSubOptions: undefined,
        } as ApplicationAndInstrumentStep);

        expect(result).toBe(true);
    });
});

describe.each([
    {
        name: 'isApplOtherHiddenP',
        rule: DisplayRules.isApplOtherHiddenP,
        shows: PatternApprovalRequiredValues.OtherApproval,
    },
    {
        name: 'isVariationHiddenP',
        rule: DisplayRules.isVariationHiddenP,
        shows: PatternApprovalRequiredValues.Variation,
    },
    {
        name: 'isNewCertificateHiddenP',
        rule: DisplayRules.isNewCertificateHiddenP,
        shows: PatternApprovalRequiredValues.NewCertificate,
    },
    {
        name: 'isApplOtherHidden',
        rule: DisplayRules.isApplOtherHidden,
        shows: PatternApprovalRequiredValues.OtherApproval,
    },
    {
        name: 'isVariationHidden',
        rule: DisplayRules.isVariationHidden,
        shows: PatternApprovalRequiredValues.Variation,
    },
    {
        name: 'isNewCertificateHidden',
        rule: DisplayRules.isNewCertificateHidden,
        shows: PatternApprovalRequiredValues.NewCertificate,
    },
])('DisplayRules.$name', ({ rule, shows }) => {
    it('shows the section for its own pattern approval type', () => {
        expect(rule(step(shows))).toBe(false);
    });

    it('hides the section for a different pattern approval type', () => {
        expect(rule(step(PatternApprovalRequiredValues.Cancellation))).toBe(
            true,
        );
    });

    it('hides the section when no pattern approval type is chosen', () => {
        expect(rule(step(undefined))).toBe(true);
    });
});

describe('DisplayRules.isApplNewInstrumentHiddenP', () => {
    it('hides the instrument section for a non new-certificate application', () => {
        const result = DisplayRules.isApplNewInstrumentHiddenP(
            step(PatternApprovalRequiredValues.Variation),
        );

        expect(result).toBe(true);
    });

    it('hides the instrument section when no pattern approval type is chosen', () => {
        expect(DisplayRules.isApplNewInstrumentHiddenP(step(undefined))).toBe(
            true,
        );
    });

    it('hides the instrument section when neither category nor type is selected', () => {
        const result = DisplayRules.isApplNewInstrumentHiddenP({
            patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
        } as ApplicationAndInstrumentStep);

        expect(result).toBe(true);
    });

    it('shows the instrument section once a category is selected', () => {
        const result = DisplayRules.isApplNewInstrumentHiddenP({
            patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
            instrumentCategory: 'category-1',
        } as ApplicationAndInstrumentStep);

        expect(result).toBe(false);
    });

    it('shows the instrument section once a type is selected', () => {
        const result = DisplayRules.isApplNewInstrumentHiddenP({
            patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
            instrumentType: 'type-1',
        } as ApplicationAndInstrumentStep);

        expect(result).toBe(false);
    });
});

describe('DisplayRules.defaultIsHidden', () => {
    it('defaults sections to hidden', () => {
        expect(DisplayRules.defaultIsHidden).toBe(true);
    });
});
