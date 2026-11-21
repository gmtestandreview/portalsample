import {
  type ApplicationAndInstrumentStep,
  type ApplicationAndInstrumentStepDto,
  PatternApprovalRequiredValueOptions,
  PatternApprovalRequiredValues,
} from '../../api/web-api-client';

export const DisplayRules = {
  isOIMLHiddenP(x: Partial<ApplicationAndInstrumentStepDto>): boolean {
    // Add your display rule logic here
    const { instrumentCategory, instrumentType, instrumentTypeContent } = x;
    const isTicked =
      x.newSubOptions?.includes(
        PatternApprovalRequiredValueOptions.OIMLCertificate,
      ) === true || x.newSubOptions === undefined;
    if (!isTicked) {
      return true; // if the OIML option is not ticked, it should be hidden (return true for hidden)
    }
    const content = instrumentTypeContent?.find(
      (p) =>
        p.instrumentTypeId === instrumentType &&
        p.instrumentCategoryId === instrumentCategory,
    );
    // if (content === undefined || content.requirements === undefined || content.requirementsLink === '') {
    if (content === undefined) {
      // the OIML option will be hidden if there is no content found for the selected instrument type
      // and category, as we cannot determine eligibility without that content
      return true;
    }
    // if no matching content is found, default to showing the OIML option (return true for hidden)
    const isNotEligible = !content.eligibleForOiml;
    return !isNotEligible;
  },

  isApplOtherHiddenP(x: Partial<ApplicationAndInstrumentStep>): boolean {
    return (
      x.patternApprovalType !== PatternApprovalRequiredValues.OtherApproval
    );
  },

  isVariationHiddenP(x: Partial<ApplicationAndInstrumentStep>): boolean {
    return x.patternApprovalType !== PatternApprovalRequiredValues.Variation;
  },

  isNewCertificateHiddenP(x: Partial<ApplicationAndInstrumentStep>): boolean {
    return (
      x.patternApprovalType !== PatternApprovalRequiredValues.NewCertificate
    );
  },

  isApplNewInstrumentHiddenP(
    x: Partial<ApplicationAndInstrumentStep>,
  ): boolean {
    return (
      x.patternApprovalType !== PatternApprovalRequiredValues.NewCertificate
    );
  },

  isOIMLHidden(x: Partial<ApplicationAndInstrumentStep>): boolean {
    // Add your display rule logic here
    return (
      x.newSubOptions?.includes(
        PatternApprovalRequiredValueOptions.OIMLCertificate,
      ) === false || x.newSubOptions === undefined
    );
  },

  isApplOtherHidden(x: ApplicationAndInstrumentStep): boolean {
    return (
      x.patternApprovalType !== PatternApprovalRequiredValues.OtherApproval
    );
  },

  isVariationHidden(x: ApplicationAndInstrumentStep): boolean {
    return x.patternApprovalType !== PatternApprovalRequiredValues.Variation;
  },

  isNewCertificateHidden(x: ApplicationAndInstrumentStep): boolean {
    return (
      x.patternApprovalType !== PatternApprovalRequiredValues.NewCertificate
    );
  },

  // Example static property
  defaultIsHidden: true,
};

export default DisplayRules;
