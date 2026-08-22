import type React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';

export interface ConfirmationModalProps {
    isOpen: boolean;
    closeModal: () => void;
    onModalYes: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    onModalNo: () => void;
    titleText: string;
    bodyText: string | JSX.Element;
    noButtonTitle: string;
    yesButtonTitle: string;
}

const ConfirmationModal = (props: ConfirmationModalProps) => {
    const {
        isOpen,
        closeModal,
        onModalYes,
        onModalNo,
        titleText,
        bodyText,
        noButtonTitle,
        yesButtonTitle,
    } = props;

    const onModalYesClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        closeModal();
        onModalYes(e);
    };

    const onModalNoClick = () => {
        closeModal();
        onModalNo();
    };

    return (
        <Modal
            size='lg'
            show={isOpen}
            aria-labelledby='modal-confirmation'
            tabIndex={-1}
            onHide={onModalNo}
            backdrop='static'
            keyboard={false}
            data-testid='prompt-confirmation-modal'
        >
            <Modal.Header>
                <Modal.Title id='modal-confirmation' as='h3'>{titleText}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div>{bodyText}</div>
            </Modal.Body>
            <Modal.Footer>
                <div className='mt-5 d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
                    <Button
                        variant='tertiary'
                        data-testid='prompt-no-button'
                        onClick={onModalNoClick}
                        className='me-md-auto order-2 order-md-0'
                    >
                        <i className='icon-close me-1' aria-hidden='true' />
                        {noButtonTitle}
                    </Button>
                    <PrimaryButton
                        data-testid='prompt-yes-button'
                        onClick={onModalYesClick}
                        className='ms-md-auto'
                    >
                        {yesButtonTitle}
                    </PrimaryButton>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmationModal;
