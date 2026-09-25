import { useMsal } from '@azure/msal-react';
import {
    Button,
    Modal,
} from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useModalState, useModalDispatch } from '../ModalContext';
import PrimaryButton from '../../Buttons/PrimaryButton';
import ButtonGroup from '../../Buttons/ButtonGroup';
import { ApplicationClient, ApplicationType } from '../../../api/web-api-client';
import { tokenRequest } from '../../../authentication/authConfig';
import { setDashboardNotification } from '../../../storage/notification';
import { NotificationSeverity } from '../../../storage/types';
import AppLogger from '../../../instrumentation/AppLogger';
import { trackGAEvent } from '../../../analytics/GoogleAnalytics';

interface SaveButtonProps {
    onClick: () => void,
}

const SaveButton = (props: SaveButtonProps) : JSX.Element => {
    const { onClick } = props;
    return (
        <PrimaryButton
            data-testid='save-button'
            onClick={onClick}
            className='ms-md-auto'
        >
            Yes, delete
        </PrimaryButton>
    );
};

interface RFQDeleteButtonsProps {
    left: any,
    right: any
}

const RFQDeleteButtons = (props: RFQDeleteButtonsProps) => {
    const { left, right } = props;
    return (
        <ButtonGroup
            left={left}
            right={right}
        />
    );
};

const RFQDeleteModal = () => {
    const modalState = useModalState();
    const modalDispatch = useModalDispatch();
    const { accounts, instance } = useMsal();
    const navigate = useNavigate();

    const handleClose = () => {
        modalDispatch?.setShowRFQDeleteModal(false, '');
    };

    const onContinueRFQDeleteModal = async () => {
        try {
            const client = new ApplicationClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            const { rfqId } = modalState ?? {};
            if (rfqId !== undefined) {
                await client.deleteApplication(rfqId, { applicationType: ApplicationType.QuoteRequest });
                setDashboardNotification({
                    message: 'The draft request has been successfully deleted',
                    severity: NotificationSeverity.Success,
                });
            }
            handleClose();
        } catch (e) {
            AppLogger.error(`Failed to delete application: ${modalState?.rfqId}`, e as Error);
        } finally {
            modalDispatch?.setShowRFQDeleteModal(false, '');
            navigate('/');
        }
    };

    const saveButton = () => (
        <SaveButton
            onClick={() => {
                onContinueRFQDeleteModal();
                trackGAEvent('Save RFQ Delete Modal');
            }}
        />
    );

    const closeButton = () => (
        <Button
            data-testid='exit-portal-button'
            onClick={() => {
                handleClose();
                trackGAEvent('Close RFQ Delete Modal');
            }}
            variant='tertiary'
            className='me-md-auto order-2 order-md-0'
        >
            <i className='icon-close me-1' aria-hidden='true' />
            {' Cancel'}
        </Button>
    );

    return (
        <Modal
            size='lg'
            show={modalState?.showRFQDeleteModal}
            aria-labelledby='modal-delete-rfq'
            enforceFocus={modalState?.showRFQDeleteModal}
            tabIndex={-1}
            backdrop='static'
            keyboard={false}
            aria-live='assertive'
            aria-atomic='false'
            data-testid='prompt-rfqdelete-modal'
            onHide={handleClose}
        >
            <Modal.Header closeButton>
                <Modal.Title
                    id='modal-delete-rfq'
                    as='h3'
                >
                    {'Confirm deletion'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body aria-live='assertive'>
                <p>
                    {'Are you sure you want to delete this Request Ref ID '}
                    <strong>{modalState?.rfqId}</strong>
                    {'? Deleting this request cannot be undone.'}
                </p>
            </Modal.Body>
            <Modal.Footer className='d-inline'>
                <RFQDeleteButtons
                    left={() => closeButton()}
                    right={() => saveButton()}
                />
            </Modal.Footer>
        </Modal>
    );
};

export default RFQDeleteModal;
