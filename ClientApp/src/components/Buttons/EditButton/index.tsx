import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';

/**
 * EditButton Component
 *
 * A button component that navigates the user to an edit page when clicked. 
 * Provides a consistent structure for the edit button and allows for navigation via the `link` prop.
 * Props:
 * @param {EditButtonProps} props - Component props
 * @param {string} [props.link] - The URL to navigate to when the button is clicked
 *
 * @returns {JSX.Element} Rendered edit button
 */

export interface EditButtonProps {
    link?: string;
}

const EditButton = (props: EditButtonProps) => {
    const { link } = props;
    const navigate = useNavigate();

    const editClick = () => {
        if (link) {
            navigate(link);
        }
    };

    return (
        <div className='d-grid gap-2 d-flex justify-content-end mt-4'>
            <Button
                variant='btn btn-tertiary'
                onClick={editClick}
                aria-label='Edit this section'
            >
                <i className='icon-edit me-1' aria-hidden='true' />
                <span>Edit</span>
            </Button>
        </div>
    );
};

export default EditButton;
