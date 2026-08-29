import { Container } from 'react-bootstrap';
import type { SteppedNavigationProps } from './types';
import stepIcon from '../../assets/Stepper.svg';

const SteppedNavigation = (props: SteppedNavigationProps) => {
    const {
        activeStep,
        steps,
        id,
        interactive,
    } = props;

    const firstNotCompleted = steps.findIndex((x) => !x.completed);

    return (
        // Not aria-hidden: the step links are focusable, and hiding a subtree that can be
        // tabbed into is the aria-hidden-focus violation. Everything needed to announce it
        // well is already here - the visually-hidden heading below, aria-labelledby,
        // aria-current per step and the per-step completion text.
        <Container data-testid={id}>
            <h2 id='step-nav' className='visually-hidden'>Form progress</h2>
            <ul className='stepped-navigation' aria-labelledby='step-nav'>
                {steps.map((step, index) => {
                    const active = activeStep === index;
                    const clickable = (firstNotCompleted === -1) || (firstNotCompleted >= index);
                    const stepClassName = [
                        active ? 'current-step' : '',
                        step.completed ? 'completed-step' : '',
                    ]
                        .filter(Boolean)
                        .join(' ');
                    let completionLabel = 'not completed';

                    if (step.completed) {
                        completionLabel = active ? 'current and completed ' : 'completed ';
                    }

                    return (
                        <li
                            key={`stepnav-${index.toString()}`}
                            className={stepClassName}
                            aria-current={active}
                        >
                            <div className='step-container'>
                                {
                                    (interactive && clickable && !active)
                                        ? (
                                            <>
                                                <a href={step.path} className='step-icon'>
                                                    <img src={stepIcon} alt='' aria-hidden='true' />
                                                    <span className='step-number'>{index + 1}</span>
                                                </a>
                                                <a href={step.path} className='step-name'>
                                                    {step.title}
                                                </a>
                                            </>
                                        )
                                        : (
                                            <>
                                                <div className='step-icon'>
                                                    <img src={stepIcon} alt='' aria-hidden='true' />
                                                    <span className='step-number'>{index + 1}</span>
                                                </div>
                                                <div className='step-name'>
                                                    {step.title}
                                                </div>
                                            </>
                                        )
                                }
                                <span className='visually-hidden'>
                                    {completionLabel}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </Container>
    );
};

export default SteppedNavigation;
