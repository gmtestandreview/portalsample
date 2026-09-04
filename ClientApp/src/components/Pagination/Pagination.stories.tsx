import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { within, expect, userEvent } from 'storybook/test';
import CustomPagination from './index';

const PaginationStory = ({ totalPages, startPage = 1 }: { totalPages: number; startPage?: number }) => {
    const [currentPage, setCurrentPage] = useState(startPage);

    return (
        <div className='py-4'>
            <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                containerClassName='d-flex justify-content-center'
            />
        </div>
    );
};

const meta = {
    title: 'Components/Pagination',
    component: CustomPagination,
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof CustomPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MidRange: Story = {
    args: {
        currentPage: 6,
        totalPages: 12,
        onPageChange: () => {},
    },
    render: () => <PaginationStory totalPages={12} startPage={6} />,
};

export const SinglePageHidden: Story = {
    args: {
        currentPage: 1,
        totalPages: 1,
        onPageChange: () => {},
    },
    render: () => <PaginationStory totalPages={1} />,
};

export const FirstPage: Story = {
    args: {
        currentPage: 1,
        totalPages: 12,
        onPageChange: () => {},
    },
    render: () => <PaginationStory totalPages={12} startPage={1} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const pageText = canvas.getByText(/page 1 of 12/i);
        await expect(pageText).toBeVisible();
        // First link hidden at page 1
        const firstLink = canvasElement.querySelector('.firstpage');
        await expect(firstLink).toHaveClass('d-none');
    },
};

export const LastPage: Story = {
    args: {
        currentPage: 12,
        totalPages: 12,
        onPageChange: () => {},
    },
    render: () => <PaginationStory totalPages={12} startPage={12} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const pageText = canvas.getByText(/page 12 of 12/i);
        await expect(pageText).toBeVisible();
        // Last link hidden at last page
        const lastLink = canvasElement.querySelector('.lastpage');
        await expect(lastLink).toHaveClass('d-none');
    },
};

export const CustomStyleVariant: Story = {
    args: {
        currentPage: 3,
        totalPages: 8,
        onPageChange: () => {},
    },
    render: () => <PaginationStory totalPages={8} startPage={3} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const pageText = canvas.getByText(/page 3 of 8/i);
        await expect(pageText).toBeVisible();
        const user = userEvent.setup();
        const page4Btn = canvas.getByRole('button', { name: /page 4/i });
        await user.click(page4Btn);
        await expect(canvas.getByText(/page 4 of 8/i)).toBeVisible();
    },
};
