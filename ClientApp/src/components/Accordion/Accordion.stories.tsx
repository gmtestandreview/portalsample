import preview from '../../../../.storybook/preview';
import { expect } from 'storybook/test';
import { CustomAccordion, CustomAccordionBody } from './index';

const meta = preview.meta({
  component: CustomAccordion,
  tags: ['ai-generated', 'needs-work', '!autodocs'],
});

export const SingleSection = meta.story({
  render: (args) => (
    <CustomAccordion {...args}>
      <CustomAccordionBody
        id='quote-step'
        eventKey='0'
        name='Quote request details'
      >
        This section is visible when the accordion renders.
      </CustomAccordionBody>
    </CustomAccordion>
  ),
  args: {
    id: 'wizard-accordion-single',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Quote request details')).toBeVisible();
  },
});

export const WithSubHeading = meta.story({
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
});
