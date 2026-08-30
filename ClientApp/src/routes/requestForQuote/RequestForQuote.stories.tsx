import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, waitFor } from 'storybook/test';
import OrganisationAndContact from './organisationAndContact';
import InstrumentAndRequest from './instrumentAndRequest';
import { withPortalProviders } from '../../storybook/storybookHarness';

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
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The component renders a BlockUISpinner until both lookup setters have run, so
        // awaiting this heading is the settled-state contract: it cannot appear before
        // /api/lookup has resolved into measurementCategories and artefactTypesSelected.
        const heading = await canvas.findByRole('heading', { name: 'Instrument/artefact details' });
        await expect(heading).toBeVisible();
        // Both lookups reached the DOM: the category list, and the artefact types filtered
        // to the story's initial 'electrical' category.
        await expect(canvas.getByRole('option', { name: 'Electrical' })).toBeInTheDocument();
        await expect(canvas.getByRole('option', { name: 'Digital thermometer' })).toBeInTheDocument();
        const availabilityDate = canvas.getByLabelText('Preferred Instrument/artefact availability date (optional)');
        await waitFor(() => expect(availabilityDate).toHaveValue('01/06/2026'));
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
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Same settled-state contract as Instrument And Request Step: the heading is behind
        // the component's BlockUISpinner branch and appears only once /api/lookup resolves.
        const heading = await canvas.findByRole('heading', { name: 'Instrument/artefact details' });
        await expect(heading).toBeVisible();
        // The seeded validation state survives the lookup settling rather than being
        // cleared by the re-render it causes.
        await expect(canvas.getByText('Select a measurement category.')).toBeVisible();
    },
};
