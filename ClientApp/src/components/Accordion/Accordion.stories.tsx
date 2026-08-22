import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { CustomAccordion, CustomAccordionBody } from './index';

const meta = {
    component: CustomAccordion,
    tags: ['ai-generated', 'needs-work', 'docs', '!autodocs'],
} satisfies Meta<typeof CustomAccordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleSection: Story = {
    render: (args) => (
        <CustomAccordion {...args}>
            <CustomAccordionBody id='quote-step' eventKey='0' name='Quote request details'>
                This section is visible when the accordion renders.
            </CustomAccordionBody>
        </CustomAccordion>
    ),
    args: {
        id: 'wizard-accordion-single',
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/quote request details/i)).toBeVisible();
    },
};

export const WithSubHeading: Story = {
    render: (args) => (
        <CustomAccordion {...args}>
            <CustomAccordionBody
                id='contact-step'
                eventKey='0'
                name='Contact details'
                namePartTwo='Complete all required fields'
                namePartTwoClassName='text-body'
            >
                Contact details content.
            </CustomAccordionBody>
        </CustomAccordion>
    ),
    args: {
        id: 'wizard-accordion-subheading',
    },
};
