import { useId } from 'react';
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

    // Per-instance so concurrently mounted modals cannot collide. Footer renders
    // three, and a shared literal id made every dialog resolve its accessible
    // name to whichever title came first in document order.
    const titleId = useId();

    return (
        <Modal
            size='lg'
            show={showModal}
            aria-labelledby={titleId}
            tabIndex={-1}
            onHide={onCancelModal}
        >
            <Modal.Header closeButton>
                <Modal.Title
                    id={titleId}
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
