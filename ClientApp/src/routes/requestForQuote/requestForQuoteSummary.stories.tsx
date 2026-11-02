import preview from '../../../../.storybook/preview';
import { expect, type screen } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import RequestForQuoteSummary from './requestForQuoteSummary';

type PlayCanvas = Pick<
  typeof screen,
  'findByText' | 'getByText' | 'getByTestId' | 'queryByText'
>;

const expectInstrumentSectionReady = async (canvas: PlayCanvas) => {
  await expect(await canvas.findByText('Request details')).toBeInTheDocument();
};

/**
 * `RequestForQuoteSummary` is the review surface of the request-for-quote wizard. It
 * presents the captured Organisation/Contact and Instrument/Request sections inside
 * accordions. While editable it shows review guidance and per-section Edit buttons;
 * once submitted it swaps those for a "Back to dashboard" link. It reads its values and hiding rules from the surrounding Formik context,
 * so the story supplies a matching one.
 */
const meta = preview.meta({
  title: 'Routes/RequestForQuote/RequestForQuoteSummary',
  component: RequestForQuoteSummary,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      initialEntries: ['/request-for-quote/QR-1/view-summary'],
      formik: {
        initialValues: {
          organisationAndContact: {},
          instrumentAndRequest: {},
        },
      },
    },
  },
  args: {
    isSubmitted: false,
  },
});

export const Editable = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Organisation and Contact')).toBeVisible();
    await expect(canvas.getByText('Instrument and Request')).toBeVisible();

    await expectInstrumentSectionReady(canvas);

    // Review guidance is shown while still editable.
    await expect(
      canvas.getByText(/before you submit your request/i),
    ).toBeVisible();
  },
});

export const Submitted = meta.story({
  args: {
    isSubmitted: true,
  },
  play: async ({ canvas }) => {
    await expectInstrumentSectionReady(canvas);

    // Submitted view replaces guidance/edit with a back-to-dashboard link.
    await expect(canvas.getByTestId('back-button')).toBeVisible();
    await expect(
      canvas.queryByText(/before you submit your request/i),
    ).toBeNull();
  },
});
