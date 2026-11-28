import preview from '../../../../.storybook/preview';
import { within, expect, waitFor } from 'storybook/test';
import OrganisationAndContact from './organisationAndContact';
import InstrumentAndRequest from './instrumentAndRequest';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Routes/RequestForQuote',
  component: OrganisationAndContact,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      initialEntries: ['/request-for-quote/123/organisation-and-contact'],
      rhf: {
        defaultValues: {
          sourceReferenceId: 'RFQ-2023-000123',
          name: 'Storybook Organisation',
          businessOrTradingName: 'Precision Testing',
          branchOrLocationName: 'Sydney Laboratory',
          abn: '12345678901',
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
          testingAndCalibrationRequirements:
            'Calibrate across the range used for field verification.',
          preferredInstrumentOrArtefactAvailabilityDate:
            '2026-06-01T00:00:00+00:00',
          measurementReportAndCertificateRequired: 'MeasurementReportOnly',
        },
      },
    },
  },
});

export const OrganisationAndContactStep = meta.story({
  render: () => <OrganisationAndContact />,
});

export const InstrumentAndRequestStep = meta.story({
  render: () => <InstrumentAndRequest />,
  parameters: {
    portal: {
      initialEntries: ['/request-for-quote/123/instrument-and-request'],
      rhf: {
        defaultValues: {
          hasSerialNumber: 'Yes',
          serialNumber: 'THERM-001',
          manufacturer: 'Fluke',
          model: '1524',
          description: 'Reference thermometer for onsite validation.',
          numberOfItems: '2',
          measurementCategory: 'electrical',
          instrumentOrArtefactType: 'digital-thermometer',
          previousQuoteOrReportNumber: 'Q230123',
          testingAndCalibrationRequirements:
            'Calibrate across the range used for field verification.',
          preferredInstrumentOrArtefactAvailabilityDate:
            '2026-06-01T00:00:00+00:00',
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
    const heading = await canvas.findByRole('heading', {
      name: 'Instrument/artefact details',
    });

    await expect(heading).toBeVisible();
    // Both lookups reached the DOM: the category list, and the artefact types filtered
    // to the story's initial 'electrical' category.
    await expect(
      canvas.getByRole('option', { name: 'Electrical' }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('option', { name: 'Digital thermometer' }),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        canvas.getByLabelText(
          'Preferred Instrument/artefact availability date (optional)',
        ),
      ).toHaveValue('01/06/2026'),
    );
  },
});

// Required-field validation is exercised against the real schemas and wizard
// shell in RequestForQuoteWizard.stories.tsx (DifferentContactRequiresContactDetails,
// InstrumentStepBlocksInvalidSubmit); this file only renders the steps in isolation.
