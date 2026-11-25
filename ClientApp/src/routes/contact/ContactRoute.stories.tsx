import preview from '../../../../.storybook/preview';
import ContactDetails from './contactDetails';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Routes/Contact/ContactDetailsStep',
  component: ContactDetails,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      rhf: {
        defaultValues: {
          contact: {
            title: 'Ms',
            firstName: 'Taylor',
            lastName: 'Nguyen',
            role: 'Laboratory Manager',
            email: 'taylor.nguyen@example.com',
            businessPhone: '02 1234 5678',
            mobilePhone: '0400 000 000',
          },
        },
      },
    },
  },
});

export const Default = meta.story();
