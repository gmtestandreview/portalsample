import preview from '../../../../.storybook/preview';
import { expect } from 'storybook/test';
import CustomPaginationHeader from './index';

const meta = preview.meta({
  title: 'Components/PaginationHeader',
  component: CustomPaginationHeader,
  parameters: {
    layout: 'centered',
  },
  args: {
    totalCount: 56,
    pageSize: 10,
    currentPage: 3,
  },
});


export const MidPage = meta.story({
  play: async ({
    canvasElement,
  }) => {
    await expect(canvasElement).toHaveTextContent(
      'Displaying 21 - 30 of 56 Results',
    );
  },
});

export const LastPage = meta.story({
  args: {
    totalCount: 56,
    pageSize: 10,
    currentPage: 6,
  },
  play: async ({
    canvasElement,
  }) => {
    await expect(canvasElement).toHaveTextContent(
      'Displaying 51 - 56 of 56 Results',
    );
  },
});
