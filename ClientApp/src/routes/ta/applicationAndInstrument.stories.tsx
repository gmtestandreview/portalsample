import preview from '../../../../.storybook/preview';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import ApplicationAndInstrument from './applicationAndInstrument';

/**
 * `ApplicationAndInstrument` is the application/instrument step of the type-approval
 * wizard. It captures the application type and instrument category/type (sourced from
 * lookups held in the form values), plus instrument and variation details. Seeding the
 * `patternApprovalType` initial value keeps the step out of its data-loading branch.
 */
const meta = preview.meta({
  title: 'Routes/TypeApproval/ApplicationAndInstrument',
  component: ApplicationAndInstrument,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      initialEntries: ['/ta/PA-1/application-details'],
      formik: {
        initialValues: {
          patternApprovalType: 'new',
          applicationAndInstrument: {},
        },
      },
    },
  },
  args: {
    name: 'applicationAndInstrument',
    isSummary: false,
  },
});


export const EditStep = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole('heading', { name: 'Instrument details' }),
    ).toBeInTheDocument();
  },
});
