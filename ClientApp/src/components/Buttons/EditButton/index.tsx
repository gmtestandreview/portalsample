import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';

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
