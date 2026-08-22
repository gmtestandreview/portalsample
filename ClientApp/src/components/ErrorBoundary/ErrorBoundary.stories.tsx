import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Button, Alert } from 'react-bootstrap';
import { Component, useState } from 'react';
import ErrorBoundary from './index';
import { ai } from '../../instrumentation/AppInsightsService';
import type { ReactPlugin } from '@microsoft/applicationinsights-react-js';

const WorkingComponent = () => (
    <Alert variant='success'>
        <strong>All good!</strong> This component rendered without errors.
    </Alert>
);

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('This component threw a render error to demonstrate the ErrorBoundary.');
    }
    return (
        <Alert variant='info'>
            This component has not thrown yet. Click the button above to simulate an error.
        </Alert>
    );
};

class ResetableErrorBoundaryWrapper extends Component<
    { children: React.ReactNode },
    { key: number }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { key: 0 };
    }

    render() {
        const { children } = this.props;
        const { key } = this.state;
        return (
            <div>
                <Button
                    variant='warning'
                    className='mb-3'
                    onClick={() => this.setState((s) => ({ key: s.key + 1 }))}
                >
                    Reset ErrorBoundary
                </Button>
                <ErrorBoundary key={key} appInsights={ai.reactPlugin as ReactPlugin}>
                    {children}
                </ErrorBoundary>
            </div>
        );
    }
}

const meta = {
    title: 'Components/ErrorBoundary',
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoError: Story = {
    render: () => (
        <ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
            <WorkingComponent />
        </ErrorBoundary>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/All good/)).toBeVisible();
    },
};

export const CaughtError: Story = {
    render: () => {
        const BrokenApp = () => {
            throw new Error('Simulated render error from a broken child component.');
        };
        return (
            <ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
                <BrokenApp />
            </ErrorBoundary>
        );
    },
};

export const RecoveredAfterReset: Story = {
    render: () => {
        const ThrowController = () => {
            const [shouldThrow, setShouldThrow] = useState(false);
            return (
                <div>
                    <Button
                        variant='danger'
                        className='mb-3 me-2'
                        onClick={() => setShouldThrow(true)}
                    >
                        Simulate render error
                    </Button>
                    <ResetableErrorBoundaryWrapper>
                        <ThrowingComponent shouldThrow={shouldThrow} />
                    </ResetableErrorBoundaryWrapper>
                </div>
            );
        };
        return <ThrowController />;
    },
};

export const NestedBoundaries: Story = {
    render: () => {
        const BrokenChild = () => {
            throw new Error('Inner component error');
        };
        return (
            <ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
                <Alert variant='success' className='mb-3'>
                    <strong>Outer content</strong> — this renders fine because the inner boundary catches the error below.
                </Alert>
                <ErrorBoundary appInsights={ai.reactPlugin as ReactPlugin}>
                    <BrokenChild />
                </ErrorBoundary>
            </ErrorBoundary>
        );
    },
};
