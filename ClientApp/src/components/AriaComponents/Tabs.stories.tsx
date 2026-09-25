import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Tabs, Tab, TabList, TabPanel, TabPanels} from './Tabs';
import {expect, fn} from 'storybook/test';
import type {Meta, StoryObj} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered'
  },
  args: {
    onSelectionChange: fn()
  },
  tags: ['interaction-test']
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
        {/*
          `transition: none` on the panels: selecting a tab mounts its panel with
          `data-entering` and the stylesheet's 400ms opacity transition. React
          Aria then waits for that transition to finish and calls a post-mount
          `flushSync` state update outside the play's act() scope — the "update to
          ForwardRef(TabPanel) was not wrapped in act(...)" warning. With no
          transition, `element.getAnimations()` is empty and React Aria settles
          the entering state synchronously during the click's commit instead.
          This is an interaction test; the fade is covered by the visual suite.
        */}
        <TabPanel id="FoR" style={{transition: 'none'}}>Arma virumque cano, Troiae qui primus ab oris.</TabPanel>
        <TabPanel id="MaR" style={{transition: 'none'}}>Senatus Populusque Romanus.</TabPanel>
        <TabPanel id="Emp" style={{transition: 'none'}}>Alea jacta est.</TabPanel>
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
