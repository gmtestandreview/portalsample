import { DashboardItemStatus, QuoteStatus, ReportStatus } from './enums';

export const validPillStatuses = [
  QuoteStatus.QuoteAccepted,
  QuoteStatus.QuoteDeclined,
  QuoteStatus.QuoteExpired,
  QuoteStatus.QuoteClosed,
  QuoteStatus.ReportIssued,
  QuoteStatus.ReportNotIssued,
  QuoteStatus.ReportInProgress,
  QuoteStatus.ReportWithdrawn,
  QuoteStatus.ArtifactReceived,
];

export const proceedDeclineValidStatuses = [
  QuoteStatus.QuoteDeclined,
  QuoteStatus.QuoteAccepted,
  QuoteStatus.QuoteExpired,
  QuoteStatus.QuoteClosed,
  QuoteStatus.ReportIssued,
  QuoteStatus.ReportNotIssued,
  QuoteStatus.ReportWithdrawn,
  QuoteStatus.ReportInProgress,
  QuoteStatus.ArtifactReceived,
];

export const validQuoteIdStatus = [
  DashboardItemStatus.ArtifactReceived,
  DashboardItemStatus.ReportInProgress,
  DashboardItemStatus.QuoteAccepted,
  DashboardItemStatus.ReportIssued,
];

export const viewQuotationAcceptMenu = [
  DashboardItemStatus.ArtifactReceived,
  DashboardItemStatus.ReportIssued,
  DashboardItemStatus.ReportNotIssued,
  DashboardItemStatus.QuoteAccepted,
  DashboardItemStatus.QuoteDeclined,
  DashboardItemStatus.ReportInProgress,
];

export const viewArtefactHeadingStatus = [
  DashboardItemStatus.ArtifactReceived,
  DashboardItemStatus.ReportInProgress,
  DashboardItemStatus.QuoteAccepted,
  DashboardItemStatus.ReportWithdrawn,
  DashboardItemStatus.ReportIssued,
];

export const viewReportLinkStatus = [
  ReportStatus.Withdrawn,
  ReportStatus.NotIssued,
];

export const viewReportRecalibrationLinkStatus = [
  DashboardItemStatus.ReportNotIssued,
  DashboardItemStatus.ReportWithdrawn,
];
