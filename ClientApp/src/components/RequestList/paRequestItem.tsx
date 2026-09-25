import type React from 'react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    Row, Col, Card,
    Button,
} from 'react-bootstrap';
import { useMsal } from '@azure/msal-react';
import {
    type PatternApprovalDashboardDetailsDto,
    ApplicationClient,
    ApplicationType,
} from '../../api/web-api-client';
import { PaDashboardItemStatus } from '../../routes/common/enums';
import StatusPill from '../Pill/StatusPill';
import Actions, { type DropdownActionItem } from '../Actions';
import { trackGAEvent } from '../../analytics/GoogleAnalytics';
import { DashboardTab } from '../SearchFilter/types';
import ConfirmationModal from '../modals/ConfirmationModal';
import { tokenRequest } from '../../authentication/authConfig';
import AppLogger from '../../instrumentation/AppLogger';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';

const formattedDate = (dateToFormat : Date | string | undefined) => (dateToFormat ? new Date(dateToFormat).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
}) : '');

interface PaRequestItemProps {
    request: PatternApprovalDashboardDetailsDto;
    tab: DashboardTab;
    setDeleteSuccess: (success: boolean) => void;
}

const PaRequestItem = ({
    request,
    tab,
    setDeleteSuccess,
}: PaRequestItemProps) => {

    const {
        referenceId, portalReferenceId, status, title, lastUpdated, statusDetail, summary, appliedFor, assessedAs,
    } = request;

    const heading = title;
    const [deleteId, setDeleteId] = useState<string>(); // TODO: Change dto to int
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const { accounts, instance } = useMsal();
    const viewApplicationVisibleStatuses = [PaDashboardItemStatus.PaSubmitted,
        PaDashboardItemStatus.PaInProgress,
        PaDashboardItemStatus.PaOnHold,
        PaDashboardItemStatus.PaCompleted];
    const isViewApplicationVisible = viewApplicationVisibleStatuses.includes(status as PaDashboardItemStatus);

    const cardRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const onDelete = () => (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        setDeleteDialogOpen(true);
        setDeleteId(portalReferenceId);
    };

    const closeModal = () => setDeleteDialogOpen(false);

    const onRemoveItem = async () => {
        try {
            const client = new ApplicationClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);

            await client.deleteApplication(deleteId!, { applicationType: ApplicationType.PatternApproval });
            setDashboardNotification({
                message: 'The draft request has been successfully deleted',
                severity: NotificationSeverity.Success,
            });

            closeModal();
            setDeleteSuccess(true);
        } catch (e) {
            AppLogger.error(`Failed to delete application: ${deleteId}`, e as Error);
            closeModal();
        }
    };

    const navigate = useNavigate();
    const messageCount = request.unreadMessageCount ?? 0;
    const messagesRoute = `/ta/${portalReferenceId}/manage?tab=messages`;
    const appDetailsRoute = `/ta/${portalReferenceId}/manage`;
    const editApplicationRoute = `/ta/${portalReferenceId}`;
    const editRoute = tab === DashboardTab.Drafts ? editApplicationRoute : appDetailsRoute;

    function routeToMessages() {
        navigate(messagesRoute);
        trackGAEvent('Application item/view messages');
    }

    const getActions = (): DropdownActionItem[] => {
        const actions: DropdownActionItem[] = [];

        // TODO: Move this to an enum? refactor this...
        switch (status) {
            case PaDashboardItemStatus.PaDraft:
                actions.push({
                    action: 'Edit',
                    text: 'Resume application',
                    route: editRoute,
                    onClick: () => trackGAEvent('Editapplication'),
                });
                actions.push({
                    action: 'Delete',
                    text: 'Delete application',
                    onClick: (e) => {
                        onDelete()(e);
                        trackGAEvent('Deleteapplication');
                    },
                });
                break;
            case PaDashboardItemStatus.PaSubmitted:
            case PaDashboardItemStatus.PaInProgress:
            case PaDashboardItemStatus.PaOnHold:
            case PaDashboardItemStatus.PaCompleted:
                actions.push({
                    action: 'Edit',
                    text: 'View application details',
                    route: editRoute,
                    onClick: () => trackGAEvent('Viewapplicationdetails'),
                });
                actions.push({
                    action: 'Messages',
                    text: 'View messages',
                    onClick: routeToMessages,
                });
                break;
            default:
                break;
        }
        return actions;
    };

    // Card aria-labelledby
    const cardSummaryId = `card-summary-${portalReferenceId}`;
    const labelledBy = isFocused ? '' : cardSummaryId;

    return (
        <>
            <Card
                ref={cardRef}
                id={`RefId-${portalReferenceId}`}
                key={`RefId-${portalReferenceId}`}
                className='mb-4 p-2 shadow'
                tabIndex={0}
                aria-labelledby={labelledBy}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            >
                <Card.Body>
                    <Row className='mb-4 align-items-center'>
                        <Col lg={9}>
                            <h3 id={cardSummaryId} className='mb-1'>
                                {heading ? `${heading} ` : 'Draft request for Quote '}
                            </h3>
                        </Col>
                        <Col lg={2} className='py-1' aria-hidden={!isFocused}>
                            <Col className='small d-flex justify-content-end'>
                                <StatusPill status={status as PaDashboardItemStatus} />
                            </Col>
                        </Col>
                        <Col lg={1} className='text-end'>
                            <Actions
                                id={`actions-${portalReferenceId}`}
                                as='icon'
                                variant='Blue'
                                dropDownActions={getActions()}
                                align='start'
                                containerClassName='dash-item-actions align-self-center'
                                onItemClick={onDelete()}
                            />
                        </Col>
                    </Row>
                    <Row className='-mb-3'>
                        <Col>
                            <Row>
                                <Col md={6}>
                                    <p className='fw-bold small pb-0 mb-0 lh-sm'>Reference ID</p>
                                    <p className='small'>{referenceId}</p>
                                </Col>
                                <Col md={6}>
                                    <p className='fw-bold small pb-0 mb-0 lh-sm'>Applied for</p>
                                    <p className='small'>{appliedFor}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <p className='fw-bold small pb-0 mb-0 lh-sm'>Last Updated</p>
                                    <p className='small'>{formattedDate(lastUpdated)}</p>
                                </Col>
                                <Col md={6}>
                                    <p className='fw-bold small pb-0 mb-0 lh-sm'>Assessed by NMI as</p>
                                    <p className='small'>{assessedAs}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={12}>
                                    <p className='fw-bold small pb-0 mb-0 lh-sm'>Summary of your application</p>
                                    <p className='small text-truncate text-truncate-2 lh-sm'>{summary}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={12}>
                                    <p className='fw-bold small pb-0 mb-0 lh-sm'>Status detail</p>
                                    <p className='small'>
                                        <StatusPill status={status as PaDashboardItemStatus} />
                                        {statusDetail}
                                    </p>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row className='-d-none'>
                        <Col md className='text-center'>
                            {isViewApplicationVisible ? (
                                <Button
                                    variant='secondary'
                                    data-testid={`RefId-${portalReferenceId}-view-details-button`}
                                    className='ms-md-auto'
                                    onClick={() => {
                                        trackGAEvent('Application item/view details');
                                        navigate(appDetailsRoute);
                                    }}
                                >
                                    View application details
                                </Button>
                            ) : (
                                <Button
                                    variant='secondary'
                                    data-testid={`RefId-${portalReferenceId}-resume-appl-button`}
                                    className='ms-md-auto'
                                    onClick={() => {
                                        trackGAEvent('Application item/resume application');
                                        navigate(editRoute);
                                    }}
                                >
                                    Resume application
                                </Button>
                            )}
                            {status !== PaDashboardItemStatus.PaDraft && (
                                <Button
                                    onClick={() => routeToMessages()}
                                    type='button'
                                    className='btn btn-secondary ms-4'
                                    title={`${messageCount} unread messages`}
                                >
                                    <span>
                                        <span className='d-none d-md-inline-block'>
                                            {'Messages '}
                                        </span>
                                        {messageCount > 0 && (
                                            <>
                                                <span className='-me-md-2'>
                                                    <span
                                                        className='badge badge-sm rounded-pill d-inline fade show bg-dark-red text-white'
                                                        style={{ fontFamily: 'monospace', top: '-10px' }}
                                                        role='status'
                                                    >
                                                        {messageCount}
                                                    </span>
                                                </span>
                                                <span className='visually-hidden'>
                                                    {' unread'}
                                                </span>
                                            </>
                                        )}
                                    </span>
                                </Button>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <ConfirmationModal
                closeModal={closeModal}
                isOpen={deleteDialogOpen}
                titleText='Confirm deletion'
                bodyText={
                    (
                        <p>
                            {'Are you sure you want to delete this draft application with id: '}
                            <strong className='me-1'>
                                {portalReferenceId}
                            </strong>
                            ?
                        </p>
                    )
                }
                onModalNo={closeModal}
                onModalYes={() => onRemoveItem && onRemoveItem()}
                noButtonTitle='Cancel'
                yesButtonTitle='Yes, delete application'
            />
        </>
    );
};

export default PaRequestItem;
