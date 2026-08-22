import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import CustomPaginationHeader from './index';

const meta = {
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
    tags: ['autodocs'],
} satisfies Meta<typeof CustomPaginationHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MidPage: Story = {
    play: async ({ canvasElement }) => {
        await expect(canvasElement).toHaveTextContent('Displaying 21 - 30 of 56 Results');
    },
};

export const LastPage: Story = {
    args: {
        totalCount: 56,
        pageSize: 10,
        currentPage: 6,
    },
    play: async ({ canvasElement }) => {
        await expect(canvasElement).toHaveTextContent('Displaying 51 - 56 of 56 Results');
    },
};
