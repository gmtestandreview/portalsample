import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { Alert, Button } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import { useAccountState, useAccountDispatch } from '../../../authentication/hooks';
import PrimaryButton from '../../Buttons/PrimaryButton';
import ButtonGroup from '../../Buttons/ButtonGroup';
import TermsOfUse from '../../Footer/termsOfUse';
import { UsersClient } from '../../../api/web-api-client';
import { tokenRequest } from '../../../authentication/authConfig';
import termsData from '../../../terms-config.json';

interface DefaultTermsAndConditionModalHeaderProps {
    userName?: string,
}

const DefaultTermsAndConditionModalHeader = (props: DefaultTermsAndConditionModalHeaderProps) : ReactElement => {
    const { userName } = props;

    return (
        <>
            {`Welcome, ${userName}`}
        </>
    );
};

// Any change to the text, update TermsVersion in terms-config.json
const DefaultTermsAndConditionModalBody = () : ReactElement => (
    <>
        <p>Before you begin, please read and agree to the NMI Services portal terms of use.</p>
        <h3 data-testid='termsofuse-heading'>Terms of use</h3>
        <TermsOfUse />
        <p>
            Please accept the Terms of use to continue. Alternatively, you may close your web browser session if you do
            not wish to continue.
        </p>
    </>
);

interface SavingTermsAndConditionErrorProps {
    showError: boolean,
}

const SavingTermsAndConditionError = (props: SavingTermsAndConditionErrorProps) : ReactElement | null => {
    const { showError } = props;
    if (showError) {
        return (
            <Alert variant='danger' role='alert' aria-live='assertive' className='d-flex'>
                <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                    <div className='bgCircle me-3'>
                        <i className='icon-warning' aria-hidden='true' />
                    </div>
                </div>
                <div>
                    <p className='mb-3'>Error found trying to save terms and condition. Try again later!</p>
                </div>
            </Alert>
        );
    }
    return null;
};

const AnchorLinkToNmi = () : JSX.Element => (
    <Button
        data-testid='exit-portal-button'
        href='/sign-out'
        variant='tertiary'
        className='me-md-auto order-2 order-md-0'
    >
        <i className='icon-back me-1' aria-hidden='true' />
        {' Exit portal'}
    </Button>
);

interface AgreeButtonProps {
    onClick: () => void,
}

const AgreeButton = (props: AgreeButtonProps) : JSX.Element => {
    const { onClick } = props;
    return (
        <PrimaryButton
            data-testid='agree-continue-button'
            onClick={onClick}
            className='ms-md-auto'
        >
            Agree and continue
        </PrimaryButton>
    );
};

interface TermAndConditionButtonsProps {
    left: any,
    right: any
}

const TermAndConditionButtons = (props: TermAndConditionButtonsProps) => {
    const { left, right } = props;
    return (
        <ButtonGroup
            left={left}
            right={right}
        />
    );
};

const TermsAndConditionModal = () => {
    const [savingTermsAndConditionError, setSavingTermsAndConditionError] = useState(false);
    const { inProgress, accounts, instance } = useMsal();
    const accountState = useAccountState();
    const accountDispatch = useAccountDispatch();

    const onContinueTermsAndConditionModal = async () => {
        if (inProgress === InteractionStatus.None && accounts.length > 0) {
            const client = new UsersClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);

            try {
                await client.acceptTermsAndCondition({ termsVersion: +termsData.TermsVersion });
                if (accountDispatch) {
                    accountDispatch.setAgree();
                }
            } catch {
                setSavingTermsAndConditionError(true);
            }
        }
    };

    const anchorLink = () => (
        <AnchorLinkToNmi />
    );

    const agreeButton = () => (
        <AgreeButton onClick={onContinueTermsAndConditionModal} />
    );

    return (
        <Modal
            size='lg'
            show={!accountState?.details?.userAcceptedTermsOfUse}
            aria-modal={!accountState?.details?.userAcceptedTermsOfUse}
            enforceFocus={!accountState?.details?.userAcceptedTermsOfUse}
            aria-live='assertive'
            aria-atomic='false'
            tabIndex={-1}
            backdrop='static'
            keyboard={false}
            data-testid='prompt-termsandcondition-modal'
            // aria-labelledby='modal-prompt-terms'
        >
            <Modal.Header closeButton={false}>
                <SavingTermsAndConditionError showError={savingTermsAndConditionError} />
                <Modal.Title
                    id='modal-prompt-terms'
                    as='h2'
                >
                    <DefaultTermsAndConditionModalHeader
                        userName={accountState?.details?.givenName
                            ? `${accountState?.details?.givenName} ${accountState?.details?.familyName}`
                            : `${accountState?.details?.familyName}`}
                    />
                    <span className='visually-hidden'> (modal dialog)</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <DefaultTermsAndConditionModalBody />
            </Modal.Body>
            <Modal.Footer className='d-inline'>
                <TermAndConditionButtons
                    left={anchorLink}
                    right={() => agreeButton()}
                />
            </Modal.Footer>
        </Modal>
    );
};

export default TermsAndConditionModal;
