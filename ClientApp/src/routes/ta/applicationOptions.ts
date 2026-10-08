import {
  PatternApprovalRequiredValueOptions,
  PatternApprovalRequiredValues,
} from '../../api/web-api-client';

export const applicationTypes = [
  {
    key: 'new',
    id: 'appl-new',
    label: 'New Certificate of Approval (CoA)',
    value: PatternApprovalRequiredValues.NewCertificate,
  },
  {
    key: 'var',
    id: 'appl-var',
    label: 'Variation or request a minor edit',
    value: PatternApprovalRequiredValues.Variation,
  },
  {
    key: 'oth',
    id: 'appl-oth',
    label: 'Other options',
    value: PatternApprovalRequiredValues.OtherApproval,
  },
];

export const newCertificateSubOptions = [
  {
    label: 'NMI Pattern Approval Certificate',
    value: PatternApprovalRequiredValueOptions.CertificateofApproval,
    id: 'q-appl-new-nmiapprcert',
    descriptor:
      'Certificate of approval for a new instrument intended for trade use in Australia',
  },
  {
    label: 'International Organisation of Legal Metrology (OIML) Certificate',
    value: PatternApprovalRequiredValueOptions.OIMLCertificate,
    id: 'q-appl-new-oimlcert',
    descriptor:
      'For potential recognition by overseas authorities and applicable to certain approved categories',
  },
  {
    label: 'Conversion Certificate',
    value: PatternApprovalRequiredValueOptions.ConversionCertificate,
    id: 'q-appl-new-convercert',
    descriptor: 'In conjunction with General Certificate 6B/0',
  },
];

export const variationSubOptions = [
  {
    label: 'Variation',
    value: PatternApprovalRequiredValueOptions.VariationtoanExistingCoA,
    id: 'q-appl-var-variation',
    descriptor: 'Add models or make changes to approved instruments',
  },
  {
    label: 'Certificate edits',
    value: PatternApprovalRequiredValueOptions.AmendmenttoanExistingCoA,
    id: 'q-appl-var-cert-edits',
    descriptor:
      'Minor editorial changes that do not alter metrological specifications',
  },
];

export const otherApprovalSubOptions = [
  {
    label: 'Review of an approval',
    value: PatternApprovalRequiredValueOptions.ReviewofApproval,
    id: 'q-appl-oth-reviewappr',
    descriptor: 'Triggered by significant changes to approval requirements',
  },
  {
    label: 'Provisional',
    value: PatternApprovalRequiredValueOptions.ProvisionalCertificate,
    id: 'q-appl-oth-prov',
    descriptor:
      'Provisional certificate of approval while your full application is in progress',
  },
  {
    label: 'Certificate cancellation',
    value: PatternApprovalRequiredValueOptions.CertificateCancellation,
    id: 'q-appl-oth-withdrawcert',
    descriptor: 'Discontinue an existing certificate',
  },
];
