export enum QuoteStatus {
    QuoteSubmitted = 'Submitted',
    QuoteInProgress = 'Quote - In Progress',
    QuoteAvailable = 'Quote - Available',
    QuoteAccepted = 'Quote - Accepted',
    QuoteDeclined = 'Quote - Declined',
    QuoteExpired = 'Quote - Expired',
    QuoteClosed = 'Quote - Closed',
    ReportIssued = 'Report - Issued',
    ReportInProgress = 'Report - In progress',
    ReportWithdrawn = 'Report - Withdrawn',
    ArtifactReceived = 'Artefact - Received',
}

export enum DashboardItemStatus {
    QuoteAvailable = 'Quote offer is available',
    QuoteInProgress = 'Quote request is in-progress',
    QuoteSubmitted = 'Quote request submitted',
    QuoteAccepted = 'Quote offer is accepted',
    QuoteDrafted = 'Quote request drafted',
    QuoteDeclined = 'Quote offer declined',
    QuoteExpired = 'Quote offer expired',
    QuoteClosed = 'Quote offer closed',
    ReportIssued = 'Report is available',
    ReportInProgress = 'Report is in-progress',
    ReportWithdrawn = 'Report is withdrawn',
    ArtifactReceived = 'Instrument/Artefact received',
}

export enum PaDashboardItemStatus {
    PaDraft = 'Draft',
    PaSubmitted = 'Submitted',
    PaInProgress = 'InProgress',
    PaOnHold = 'OnHold',
    PaCompleted = 'Completed',
}

export enum ReportStatus {
    Withdrawn = 'Withdrawn',
    Issued = 'Issued',
    Expired = 'Expired',
    Cancelled = 'Cancelled',
    NotIssued = 'NotIssued',
}

export enum Environment {
    Local = 'Local',
    Dev = 'Development',
    Test = 'Test',
    UAT = 'UAT',
    PreProd = 'PreProd',
    Prod = 'Prod',
}
