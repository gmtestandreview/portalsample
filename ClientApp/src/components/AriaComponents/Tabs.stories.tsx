import {Tabs, Tab, TabList, TabPanel, TabPanels} from '../src/Tabs';
import {expect, fn} from 'storybook/test';
import type {Meta, StoryObj} from '@storybook/react';

const meta = {
  component: Tabs,
  parameters: {
    layout: 'centered'
  },
  args: {
    onSelectionChange: fn()
  },
  tags: ['autodocs', 'interaction-test']
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: args => (
    <Tabs {...args}>
      <TabList aria-label="History of Ancient Rome">
        <Tab id="FoR">Founding of Rome</Tab>
        <Tab id="MaR">Monarchy and Republic</Tab>
        <Tab id="Emp">Empire</Tab>
      </TabList>
      <TabPanels>
        <TabPanel id="FoR">Arma virumque cano, Troiae qui primus ab oris.</TabPanel>
        <TabPanel id="MaR">Senatus Populusque Romanus.</TabPanel>
        <TabPanel id="Emp">Alea jacta est.</TabPanel>
      </TabPanels>
    </Tabs>
  ),
  play: async ({args, canvas, userEvent}) => {
    const empireTab = canvas.getByRole('tab', {name: 'Empire'});

    await userEvent.click(empireTab);

    await expect(empireTab).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Alea jacta est.');
    await expect(args.onSelectionChange).toHaveBeenCalledWith('Emp');
  }
};
