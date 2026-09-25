import {
    type ApplicationAndInstrumentStep,
    type ApplicationAndInstrumentStepDto,
    PatternApprovalRequiredValueOptions,
    PatternApprovalRequiredValues,
} from '../../api/web-api-client';

export class DisplayRules {
    static isOIMLHiddenP(x: Partial<ApplicationAndInstrumentStepDto>): boolean {
        // Add your display rule logic here
        const { instrumentCategory, instrumentType, instrumentTypeContent } = x;
        const isTicked = x.newSubOptions?.includes(PatternApprovalRequiredValueOptions.OIMLCertificate) === true || x.newSubOptions === undefined;
        if (isTicked === false) {
            return true; // if the OIML option is not ticked, it should be hidden (return true for hidden)
        }
        const content = instrumentTypeContent?.find((p) => p.instrumentTypeId === instrumentType && p.instrumentCategoryId === instrumentCategory);
        // if (content === undefined || content.requirements === undefined || content.requirementsLink === '') {
        if (content === undefined) {
            // the OIML option will be hidden if there is no content found for the selected instrument type
            // and category, as we cannot determine eligibility without that content
            return true;
        }
        // if no matching content is found, default to showing the OIML option (return true for hidden)
        const isNotEligible = !content.eligibleForOiml;
        return isTicked && !isNotEligible;
    }

    static isApplOtherHiddenP(x: Partial<ApplicationAndInstrumentStep>): boolean {
        return x.patternApprovalType !== PatternApprovalRequiredValues.OtherApproval || x.patternApprovalType === undefined;
    }

    static isVariationHiddenP(x: Partial<ApplicationAndInstrumentStep>): boolean {
        return x.patternApprovalType !== PatternApprovalRequiredValues.Variation || x.patternApprovalType === undefined;
    }

    static isNewCertificateHiddenP(x: Partial<ApplicationAndInstrumentStep>): boolean {
        return x.patternApprovalType !== PatternApprovalRequiredValues.NewCertificate || x.patternApprovalType === undefined;
    }

    static isApplNewInstrumentHiddenP(x: Partial<ApplicationAndInstrumentStep>): boolean {
        if (x.patternApprovalType !== PatternApprovalRequiredValues.NewCertificate || x.patternApprovalType === undefined) {
            return true;
        }
        if (!x.instrumentCategory && !x.instrumentType) {
            return true;
        }
        return false;
    }

    static isOIMLHidden(x: ApplicationAndInstrumentStep): boolean {
        // Add your display rule logic here
        return x.newSubOptions?.includes(PatternApprovalRequiredValueOptions.OIMLCertificate) === false || x.newSubOptions === undefined;
    }

    static isApplOtherHidden(x: ApplicationAndInstrumentStep): boolean {
        return x.patternApprovalType !== PatternApprovalRequiredValues.OtherApproval || x.patternApprovalType === undefined;
    }

    static isVariationHidden(x: ApplicationAndInstrumentStep): boolean {
        return x.patternApprovalType !== PatternApprovalRequiredValues.Variation || x.patternApprovalType === undefined;
    }

    static isNewCertificateHidden(x: ApplicationAndInstrumentStep): boolean {
        return x.patternApprovalType !== PatternApprovalRequiredValues.NewCertificate || x.patternApprovalType === undefined;
    }

    // Example static property
    static readonly defaultIsHidden: boolean = true;
}

export default DisplayRules;
