import type { Meta, StoryObj } from '@storybook/react-vite';
import ContactDetails from './contactDetails';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Routes/Contact/ContactDetailsStep',
    component: ContactDetails,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
        portal: {
            formik: {
                initialValues: {
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
} satisfies Meta<typeof ContactDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ValidationState: Story = {
    parameters: {
        portal: {
            formik: {
                initialValues: {
                    contact: {
                        title: '',
                        firstName: '',
                        lastName: '',
                        role: '',
                        email: '',
                        businessPhone: '',
                        mobilePhone: '',
                    },
                },
                initialErrors: {
                    contact: {
                        firstName: 'Enter a first name.',
                        lastName: 'Enter a last name.',
                        email: 'Enter an email address.',
                    },
                },
                initialTouched: {
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
