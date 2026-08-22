import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router';
import type { DashboardItemDto } from '../../ClientApp/src/api/web-api-client';
import { AccountDispatchCtx, AccountStateCtx } from '../../ClientApp/src/authentication/accountContext';
import InstrumentItem from '../../ClientApp/src/components/RequestList/instrumentItem';
import { ModalDispatchCtx, ModalStateCtx } from '../../ClientApp/src/components/modals/ModalContext';
import { DashboardItemStatus } from '../../ClientApp/src/routes/common/enums';

const noop = () => {};

const instrumentFixture: DashboardItemDto = {
    referenceId: 'RFQ-2023-009012',
    status: DashboardItemStatus.ReportIssued,
    requestedFor: 'Storybook Organisation',
    lastUpdated: new Date('2023-11-28'),
    requestForQuote: {
        id: 3,
        manufacturer: 'Mettler Toledo',
        model: 'XPE205',
        serialNumber: 'B123456789',
        measurementCategory: 'Mass',
        artefactType: 'Analytical Balance',
        requestSubmitted: new Date('2023-09-01'),
        contactDetails: {
            firstName: 'Taylor',
            lastName: 'Nguyen',
            email: 'taylor.nguyen@example.com',
            businessPhone: '02 1234 5678',
        },
        hideFromDashboard: false,
    },
    quote: {
        quotationId: 'Q-2023-007777',
        artefactName: 'Mettler Toledo XPE205 Analytical Balance',
        dateRequired: new Date('2023-09-15'),
        offerDate: new Date('2023-09-10'),
        validUntil: new Date('2023-11-10'),
        nmiContactDetails: {
            firstName: 'NMI',
            lastName: 'Officer',
            email: 'nmi@industry.gov.au',
            businessPhone: '02 6213 6800',
        },
    },
    report: {
        reportId: 'NMI/T/C/12345',
        invoiceNumber: 'INV-2023-009012',
        dateRequired: new Date('2023-09-15'),
        dateReceived: new Date('2023-09-16'),
        dateIssued: new Date('2023-11-25'),
        targetReportDate: new Date('2023-11-28'),
        returnMethod: 'Courier',
        dateDispatched: new Date('2023-11-28'),
        carrier: 'TNT',
        consignmentNote: 'CON123456789',
    },
    artefact: {
        tmasArtefactName: 'Mettler Toledo XPE205',
        tmasTcReportName: 'RPT-2023-12345',
        tmasTcReportDate: new Date('2023-11-25'),
        tmasMeasurementReportCertificateRequired: 'Measurement report only',
        tmasMeasurementCategoryName: 'Mass',
        tmasStatus: 'Report issued',
    },
};

describe('InstrumentItem accessibility', () => {
    it('does not emit aria-prohibited-attr for the card container', async () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <AccountStateCtx.Provider value={{
                    isLoading: false,
                    details: {
                        organisation: 'Storybook Organisation',
                        trading: 'Precision Testing',
                        branch: 'Sydney Laboratory',
                        homeAccountId: 'mock-home-account-id',
                        userAcceptedTermsOfUse: true,
                        accountCreationCompleted: true,
                        accountContactCompleted: true,
                        currentTermsVersion: '1',
                        organisationIsCompleted: true,
                        isDefaultOrganisation: true,
                        showBranchSelector: false,
                    },
                }}
                >
                    <AccountDispatchCtx.Provider value={{
                        setAgree: noop,
                        setCompleted: noop,
                        setContactCompleted: noop,
                        setDefaultOrganisationId: noop,
                        setTargetOrganisation: noop,
                        setOrganisationAndBranch: noop,
                        setUserProfile: () => Promise.resolve(true),
                        setShowBranchSelector: noop,
                        setShowRFQSelectModal: noop,
                    }}
                    >
                        <ModalStateCtx.Provider value={{ showBranchSelector: false, showRFQDeleteModal: false }}>
                            <ModalDispatchCtx.Provider value={{
                                setShowBranchSelector: noop,
                                setShowRFQDeleteModal: noop,
                                setShowRFQSelectModal: noop,
                            }}
                            >
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    <InstrumentItem request={instrumentFixture} />
                                </ul>
                            </ModalDispatchCtx.Provider>
                        </ModalStateCtx.Provider>
                    </AccountDispatchCtx.Provider>
                </AccountStateCtx.Provider>
            </MemoryRouter>,
        );

        const results = await axe.run(document.body);
        const target = results.incomplete.find((item) => item.id === 'aria-prohibited-attr');

        expect(target).toBeUndefined();
    });
});
