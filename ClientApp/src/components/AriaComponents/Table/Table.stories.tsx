import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Column, Row, Table, TableHeader, TableBody, Cell } from './Table';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Table',
  component: Table,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  render: (args) => (
    <Table aria-label='Files' {...args}>
      <TableHeader>
        <Column isRowHeader>Name</Column>
        <Column>Type</Column>
        <Column>Date Modified</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>Games</Cell>
          <Cell>File folder</Cell>
          <Cell>6/7/2020</Cell>
        </Row>
        <Row>
          <Cell>Program Files</Cell>
          <Cell>File folder</Cell>
          <Cell>4/7/2021</Cell>
        </Row>
        <Row>
          <Cell>bootmgr</Cell>
          <Cell>System file</Cell>
          <Cell>11/20/2010</Cell>
        </Row>
      </TableBody>
    </Table>
  ),
  args: {
    selectionMode: 'multiple',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('grid', { name: 'Files' })).toBeVisible();
    await expect(canvas.getByText('Games')).toBeVisible();
  },
});
