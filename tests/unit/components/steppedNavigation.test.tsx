import { render, screen } from '@testing-library/react';
import SteppedNavigation from '@/components/SteppedNavigation';

describe('SteppedNavigation', () => {
    const steps = [
        { title: 'Organisation', path: '/organisation', completed: true },
        { title: 'Contact', path: '/contact', completed: false },
        { title: 'Summary', path: '/summary', completed: false },
    ];

    it('renders links for interactive completed and reachable prior steps', () => {
        render(
            <SteppedNavigation activeStep={2} steps={steps} id='stepper' interactive />,
        );

        const organisationLink = screen.getByRole('link', { name: 'Organisation', hidden: true });
        const contactLink = screen.getByRole('link', { name: 'Contact', hidden: true });

        expect(organisationLink).toHaveAttribute('href', '/organisation');
        expect(contactLink).toHaveAttribute('href', '/contact');
    });

    it('renders the current step as non-interactive content', () => {
        const { container } = render(
            <SteppedNavigation activeStep={1} steps={steps} id='stepper' interactive />,
        );

        expect(screen.queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();

        const currentStep = container.querySelector('[aria-current="true"]');

        expect(currentStep).toHaveAttribute('aria-current', 'true');
        expect(currentStep).toHaveTextContent('Contact');
    });

    it('does not link future steps after the first incomplete step', () => {
        render(
            <SteppedNavigation activeStep={0} steps={steps} id='stepper' interactive />,
        );

        expect(screen.queryByRole('link', { name: 'Summary', hidden: true })).not.toBeInTheDocument();
        expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    it('renders every non-current step as plain content when not interactive', () => {
        render(
            <SteppedNavigation activeStep={1} steps={steps} id='stepper' interactive={false} />,
        );

        expect(screen.queryByRole('link', { hidden: true })).not.toBeInTheDocument();
        expect(screen.getByText('Organisation')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    it('marks the current completed step with both current and completed classes', () => {
        const allCompleteSteps = steps.map((step) => ({ ...step, completed: true }));
        const { container } = render(
            <SteppedNavigation activeStep={2} steps={allCompleteSteps} id='stepper' interactive />,
        );

        const currentStep = container.querySelector('[aria-current="true"]');

        expect(currentStep).toHaveClass('current-step', 'completed-step');
        expect(currentStep).toHaveTextContent('Summary');
        expect(screen.getByRole('link', { name: 'Organisation', hidden: true })).toHaveAttribute('href', '/organisation');
        expect(screen.getByRole('link', { name: 'Contact', hidden: true })).toHaveAttribute('href', '/contact');
    });
});
