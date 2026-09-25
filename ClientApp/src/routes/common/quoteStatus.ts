import { DashboardItemStatus, QuoteStatus } from './enums';

export const validPillStatuses = [
    QuoteStatus.QuoteAccepted,
    QuoteStatus.QuoteDeclined,
    QuoteStatus.QuoteExpired,
    QuoteStatus.QuoteClosed,
    QuoteStatus.ReportIssued,
    QuoteStatus.ReportInProgress,
    QuoteStatus.ReportWithdrawn,
    QuoteStatus.ArtifactReceived];

export const proceedDeclineValidStatuses = [
    QuoteStatus.QuoteDeclined,
    QuoteStatus.QuoteAccepted,
    QuoteStatus.QuoteExpired,
    QuoteStatus.QuoteClosed,
    QuoteStatus.ReportIssued,
    QuoteStatus.ReportWithdrawn,
    QuoteStatus.ReportInProgress,
    QuoteStatus.ArtifactReceived];

export const validQuoteIdStatus = [
    DashboardItemStatus.ArtifactReceived,
    DashboardItemStatus.ReportInProgress,
    DashboardItemStatus.QuoteAccepted,
    DashboardItemStatus.ReportIssued];

export const viewQuotationAcceptMenu = [
    DashboardItemStatus.ArtifactReceived,
    DashboardItemStatus.ReportIssued,
    DashboardItemStatus.QuoteAccepted];

export const viewArtefactHeadingStatus = [
    DashboardItemStatus.ArtifactReceived,
    DashboardItemStatus.ReportInProgress,
    DashboardItemStatus.QuoteAccepted,
    DashboardItemStatus.ReportWithdrawn,
    DashboardItemStatus.ReportIssued];
