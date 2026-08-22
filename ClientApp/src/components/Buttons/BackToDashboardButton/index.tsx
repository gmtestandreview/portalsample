import { Link } from 'react-router';

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
