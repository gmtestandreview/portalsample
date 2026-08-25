import { Link } from 'react-router';

/**
 * BackToDashboardButton Component
 *
 * A button component that navigates the user back to the dashboard page. 
 * provides a consistent structure for the back navigation button and allows for additional CSS classes to be applied via the `containerClassName` and `className` props.
 * Props:
 * @param {BackToDashboardButtonProps} props - Component props
 * @param {string} [props.containerClassName] - Additional CSS classes for the wrapping div
 * @param {string} [props.className] - Additional CSS classes for the link element
 *
 * @returns {JSX.Element} Rendered back to dashboard button
 */

export interface BackToDashboardButtonProps {
    containerClassName?: string;
    className?: string;
}

const BackToDashboardButton = (props: BackToDashboardButtonProps) => {
    const {
        containerClassName = '', // default props
        className = '', // default props
    } = props;

    return (
        <div className={`d-grid d-md-block ${containerClassName}`}>
            <Link
                data-testid='back-button'
                to='/dashboard'
                replace
                className={`btn btn-tertiary ${className}`}
            >
                <i className='icon-back me-1' aria-hidden='true' />Back to dashboard
            </Link>
        </div>
    );
};

export default BackToDashboardButton;
