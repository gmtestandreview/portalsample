import preview from '../../../../.storybook/preview';
import { fn } from 'storybook/test';
import ContactLink from './ContactLink';
import SkipLinks from './skipLinks';
import BackToTopButton from './backToTopButton';
import ViewPdfButton from './ViewPdfButton';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Components/Utilities',
  component: ContactLink,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
  },
});

export const ContactActions = meta.story({
  render: () => <ContactLink />,
});

export const SkipAndTopNavigation = meta.story({
  render: () => (
    <div style={{ minHeight: 320 }}>
      <SkipLinks />
      <main id='main' className='pt-5'>
        <h2>Example page content</h2>
        <p>Skip links and back-to-top affordances used by the portal shell.</p>
      </main>
      <BackToTopButton />
    </div>
  ),
});

export const PdfActionLoaded = meta.story({
  render: () => (
    <div style={{ minWidth: 360 }}>
      <ViewPdfButton
        text='View quotation PDF'
        fileSize='1.4 MB'
        isLoaded
        getPdf={fn()}
        gaLabel='Quotation PDF'
      />
    </div>
  ),
});

export const PdfActionLoading = meta.story({
  render: () => (
    <div style={{ minWidth: 360 }}>
      <ViewPdfButton
        text='View quotation PDF'
        fileSize='1.4 MB'
        isLoaded={false}
        getPdf={fn()}
        gaLabel='Quotation PDF'
      />
    </div>
  ),
});
