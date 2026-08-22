import type { ReactElement } from 'react';
import Modal from 'react-bootstrap/Modal';
import PrimaryButton from '../../Buttons/PrimaryButton';

export interface ContentModalProps {
    showModal: boolean;
    onCancelModal: () => void;
    modalBody: ReactElement;
    modalTitle: string;
}

const ContentModal = (props: ContentModalProps) => {
    const {
        showModal,
        onCancelModal,
        modalBody,
        modalTitle,
    } = props;

    return (
        <Modal
            size='lg'
            show={showModal}
            aria-labelledby='modal-content'
            tabIndex={-1}
            onHide={onCancelModal}
        >
            <Modal.Header closeButton>
                <Modal.Title
                    id='modal-content'
                    as='h3'
                >
                    {modalTitle}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {modalBody}
            </Modal.Body>
            <Modal.Footer className='justify-content-end'>
                <PrimaryButton
                    data-testid='close-button'
                    onClick={onCancelModal}
                >
                    Close
                </PrimaryButton>
            </Modal.Footer>
        </Modal>
    );
};

export default ContentModal;
