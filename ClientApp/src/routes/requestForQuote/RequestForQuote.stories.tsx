import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import OrganisationAndContact from './organisationAndContact';
import InstrumentAndRequest from './instrumentAndRequest';
import { withPortalProviders } from '../../storybook/storybookHarness';
import { artefactTypeResponses, lookupResponses } from '../../storybook/storybookFixtures';
import { CRMLookupTypes } from '../../api/web-api-client';

const lookupHandlers = [
    http.get('/api/lookup', ({ request }) => {
        const lookupType = new URL(request.url).searchParams.get('LookupType');
        return HttpResponse.json(
            lookupType === CRMLookupTypes.TCArtefactTypePortalCategory
                ? artefactTypeResponses
                : lookupResponses,
        );
    }),
];

const meta = {
    title: 'Routes/RequestForQuote',
    component: OrganisationAndContact,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
        portal: {
            initialEntries: ['/request-for-quote/123/organisation-and-contact'],
            formik: {
                initialValues: {
                    sourceReferenceId: 'RFQ-2023-000123',
                    name: 'Storybook Organisation',
                    businessOrTradingName: 'Precision Testing',
                    branchOrLocationName: 'Sydney Laboratory',
                    abn: '00000000000',
                    organisationCount: '2',
                    isCorrectBranchOrLocation: 'No',
                    isPrincipalContact: 'Yes',
                    currentContact: {
                        title: 'Ms',
                        firstName: 'Taylor',
                        lastName: 'Nguyen',
                        email: 'taylor.nguyen@example.com',
                    },
                    contact: {
                        title: 'Ms',
                        firstName: 'Taylor',
                        lastName: 'Nguyen',
                        email: 'taylor.nguyen@example.com',
                        businessPhone: '02 1234 5678',
                    },
                    hasSerialNumber: 'Yes',
                    serialNumber: 'THERM-001',
                    manufacturer: 'Fluke',
                    model: '1524',
                    description: 'Reference thermometer for onsite validation.',
                    numberOfItems: '2',
                    measurementCategory: 'electrical',
                    instrumentOrArtefactType: 'digital-thermometer',
                    previousQuoteOrReportNumber: 'Q230123',
                    testingAndCalibrationRequirements: 'Calibrate across the range used for field verification.',
                    preferredInstrumentOrArtefactAvailabilityDate: new Date('2026-06-01'),
                    measurementReportAndCertificateRequired: 'MeasurementReportOnly',
                },
            },
        },
        msw: {
            handlers: lookupHandlers,
        },
    },
} satisfies Meta<typeof OrganisationAndContact>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OrganisationAndContactStep: Story = {
    render: () => <OrganisationAndContact />,
};

export const InstrumentAndRequestStep: Story = {
    render: () => <InstrumentAndRequest />,
    parameters: {
        portal: {
            initialEntries: ['/request-for-quote/123/instrument-and-request'],
            formik: {
                initialValues: {
                    hasSerialNumber: 'Yes',
                    serialNumber: 'THERM-001',
                    manufacturer: 'Fluke',
                    model: '1524',
                    description: 'Reference thermometer for onsite validation.',
                    numberOfItems: '2',
                    measurementCategory: 'electrical',
                    instrumentOrArtefactType: 'digital-thermometer',
                    previousQuoteOrReportNumber: 'Q230123',
                    testingAndCalibrationRequirements: 'Calibrate across the range used for field verification.',
                    preferredInstrumentOrArtefactAvailabilityDate: new Date('2026-06-01'),
                    measurementReportAndCertificateRequired: 'MeasurementReportOnly',
                },
            },
        },
    },
};

export const OrganisationAndContactValidation: Story = {
    render: () => <OrganisationAndContact />,
    parameters: {
        portal: {
            initialEntries: ['/request-for-quote/123/organisation-and-contact'],
            formik: {
                initialValues: {
                    name: 'Storybook Organisation',
                    businessOrTradingName: '',
                    branchOrLocationName: '',
                    abn: '00000000000',
                    organisationCount: '2',
                    isCorrectBranchOrLocation: '',
                    isPrincipalContact: 'No',
                    currentContact: {
                        title: 'Ms',
                        firstName: 'Taylor',
                        lastName: 'Nguyen',
                        email: 'taylor.nguyen@example.com',
                    },
                    contact: {
                        title: '',
                        firstName: '',
                        lastName: '',
                        email: '',
                        businessPhone: '',
                    },
                },
                initialErrors: {
                    isCorrectBranchOrLocation: 'Select whether this is the correct branch or location.',
                    contact: {
                        firstName: 'Enter a first name.',
                        lastName: 'Enter a last name.',
                        email: 'Enter an email address.',
                    },
                },
                initialTouched: {
                    isCorrectBranchOrLocation: true,
                    contact: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        },
    },
};

export const InstrumentAndRequestValidation: Story = {
    render: () => <InstrumentAndRequest />,
    parameters: {
        portal: {
            initialEntries: ['/request-for-quote/123/instrument-and-request'],
            formik: {
                initialValues: {
                    hasSerialNumber: 'Yes',
                    serialNumber: '',
                    manufacturer: '',
                    model: '',
                    description: '',
                    numberOfItems: '',
                    measurementCategory: '',
                    instrumentOrArtefactType: '',
                    previousQuoteOrReportNumber: '',
                    testingAndCalibrationRequirements: '',
                    preferredInstrumentOrArtefactAvailabilityDate: '',
                    measurementReportAndCertificateRequired: '',
                },
                initialErrors: {
                    serialNumber: 'Enter a serial number.',
                    manufacturer: 'Enter a manufacturer.',
                    model: 'Enter a model.',
                    measurementCategory: 'Select a measurement category.',
                    instrumentOrArtefactType: 'Select an instrument or artefact type.',
                    testingAndCalibrationRequirements: 'Enter testing or calibration requirements.',
                    measurementReportAndCertificateRequired: 'Select a measurement report option.',
                },
                initialTouched: {
                    serialNumber: true,
                    manufacturer: true,
                    model: true,
                    measurementCategory: true,
                    instrumentOrArtefactType: true,
                    testingAndCalibrationRequirements: true,
                    measurementReportAndCertificateRequired: true,
                },
            },
        },
    },
};
