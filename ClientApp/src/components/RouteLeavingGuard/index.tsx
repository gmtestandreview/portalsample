import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useBlocker } from 'react-router';
import { useFormikContext } from 'formik';
import type { RouteLeavingGuardProps } from './types';
import PrimaryButton from '../Buttons/PrimaryButton';

const RouteLeavingGuard = ({
    when,
    title = 'Unsaved changes',
    body = 'You have made changes to this form. You can discard your changes, or cancel to stay on the page.',
    cancelBtn = 'Cancel',
    confirmBtn = 'Discard changes',
}: RouteLeavingGuardProps) => {
    const formik = useFormikContext();

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => Boolean(when)
        && currentLocation.pathname !== nextLocation.pathname,
    );

    const closeModal = () => {
        if (blocker.state === 'blocked') {
            blocker.reset();
        }
    };

    const handleConfirmNavigationClick = () => {
        if (blocker.state === 'blocked') {
            formik.setErrors({});
            blocker.proceed();
        }
    };

    return (
        <Modal
            show={blocker.state === 'blocked'}
            aria-labelledby='modal-unsaved'
            tabIndex={-1}
            onHide={closeModal}
            backdrop='static'
            keyboard={false}
            data-testid='prompt-save-modal'
        >
            <Modal.Header closeButton>
                <Modal.Title id='modal-unsaved' as='h3'>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {body}
            </Modal.Body>
            <Modal.Footer>
                <div className='mt-5 d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
                    <Button
                        data-testid='prompt-cancel-button'
                        onClick={closeModal}
                        variant='tertiary'
                        className='me-md-auto order-2 order-md-0'
                    >
                        <i className='icon-close me-1' aria-hidden='true' />
                        {cancelBtn}
                    </Button>
                    <PrimaryButton
                        data-testid='prompt-leave-button'
                        onClick={handleConfirmNavigationClick}
                        className='ms-md-auto'
                    >
                        {confirmBtn}
                    </PrimaryButton>
                </div>
            </Modal.Footer>
        </Modal>
    );
};
export default RouteLeavingGuard;
