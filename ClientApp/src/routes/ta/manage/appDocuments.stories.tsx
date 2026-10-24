import preview from '../../../../../.storybook/preview';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import ApplicationDocuments from './appDocuments';

/**
 * `ApplicationDocuments` is the "Documents" tab of the type-approval management surface.
 * It loads the application's supporting documents into a React Hook Form form and lets the
 * applicant add/commit additional certificates. The story renders the tab shell; the
 * document list is loaded from an API not served in Storybook.
 */
const meta = preview.meta({
  title: 'Routes/TypeApproval/Manage/ApplicationDocuments',
  component: ApplicationDocuments,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      initialEntries: ['/ta/PA-1/manage?tab=documents'],
    },
  },
});


export const DocumentsTab = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('heading', { name: 'Documents' }),
    ).toBeInTheDocument();
  },
});
