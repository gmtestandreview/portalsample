import { Link, useNavigate } from 'react-router';
import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useEffect, useState } from 'react';
import type { ChangeEvent, ReactElement } from 'react';
import {
    Alert,
    Button,
    Modal,
    Row,
    Col,
    Table,
} from 'react-bootstrap';
import { useAccountState, useAccountDispatch } from '../../../authentication/hooks';
import { useModalState, useModalDispatch } from '../ModalContext';
import BlockUISpinner from '../../BlockUISpinner';
import PrimaryButton from '../../Buttons/PrimaryButton';
import ButtonGroup from '../../Buttons/ButtonGroup';
import { OrganisationsClient, UsersClient } from '../../../api/web-api-client';
import type { OrganisationDto } from '../../../api/web-api-client';
import { tokenRequest } from '../../../authentication/authConfig';
import NotificationMessage from '../../Alert/NotificationMessage';
import { clearBranchModalNotification, getBranchModalNotification } from '../../../storage/notification';
import AppLogger from '../../../instrumentation/AppLogger';
import { BranchSelectionModalMode } from './enums';

interface SavingBranchSelectorErrorProps {
    showError: boolean,
}

const showBranchModalMessage = (message: JSX.Element | null) => (
    <>
        {message && (
            <Row className='mb-4'>
                <Col>
                    {message}
                </Col>
            </Row>
        )}
    </>
);

const setNotification = () => {
    const branchModalNotification = getBranchModalNotification();
    return (
        branchModalNotification
            ? (
                <NotificationMessage
                    id='notif-message-1'
                    canClose
                    onClose={clearBranchModalNotification}
                    {...branchModalNotification}
                />
            )
            : null);
};

const SavingBranchSelectorError = (props: SavingBranchSelectorErrorProps) : ReactElement | null => {
    const { showError } = props;
    if (showError) {
        return (
            <Row className='mb-4'>
                <Col>
                    <Alert variant='danger' className='d-flex' role='alert' aria-live='assertive'>
                        <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                            <div className='bgCircle me-3'>
                                <i className='icon-warning' aria-hidden='true' />
                            </div>
                        </div>
                        <div>
                            <p className='mb-3'>Error trying to save default branch/location. Try again later!</p>
                        </div>
                    </Alert>
                </Col>
            </Row>
        );
    }
    return null;
};

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
            Save and continue
        </PrimaryButton>
    );
};

interface BranchSelectorButtonsProps {
    left: any,
    right: any
}

type SortableBranchKey =
    | 'abn'
    | 'branchOrLocationName'
    | 'businessListName'
    | 'businessOrTradingName'
    | 'crmGuid'
    | 'name';

const BranchSelectorButtons = (props: BranchSelectorButtonsProps) => {
    const { left, right } = props;
    return (
        <ButtonGroup
            left={left}
            right={right}
        />
    );
};

const hasDefaultOrganisationId = (defaultOrganisationId?: number | null) => defaultOrganisationId != null;

const toSortableText = (value: string | undefined) => value?.toLowerCase() ?? '';

// Fix 11 — S3776: Module-scope helper 1
const applyAccountDispatchUpdates = (
    accountDispatch: ReturnType<typeof useAccountDispatch>,
    selectedBranch: number | undefined,
    selectedCRMGuid: string | undefined,
    selectedOrganisation: string | undefined,
    selectedTradingName: string | undefined,
    selectedBranchName: string | undefined,
) => {
    if (!accountDispatch) return;
    accountDispatch.setDefaultOrganisationId(selectedBranch, selectedCRMGuid);
    if (selectedOrganisation !== undefined) {
        accountDispatch.setOrganisationAndBranch(
            selectedOrganisation,
            selectedTradingName ?? '',
            selectedBranchName ?? '',
        );
    }
};

// Fix 11 — S3776: Module-scope helper 2 (Fix 6 absorbed here)
const finaliseAccountCreation = (
    accountState: ReturnType<typeof useAccountState>,
    accountDispatch: ReturnType<typeof useAccountDispatch>,
    selectedBranch: number | undefined,
    selectedCRMGuid: string | undefined,
    selectedOrganisation: string | undefined,
    selectedABN: string | undefined,
) => {
    const accountCreationIncomplete = !accountState?.details?.accountCreationCompleted;
    if (accountCreationIncomplete) {
        accountDispatch?.setCompleted();
        accountDispatch?.setDefaultOrganisationId(selectedBranch, selectedCRMGuid);
        accountDispatch?.setTargetOrganisation(selectedOrganisation!, selectedABN!);
    }
};

const BranchSelectorModal = () => {
    const [isModalDataLoading, setIsModalDataLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savingBranchSelectorError, setSavingBranchSelectorError] = useState(false);
    const { inProgress, accounts, instance } = useMsal();
    const [selectedBranch, setSelectedBranch] = useState<number | undefined>();
    const [selectedOrganisation, setSelectedOrganisation] = useState<string | undefined>();
    const [selectedTradingName, setSelectedTradingName] = useState<string | undefined>();
    const [selectedBranchName, setSelectedBranchName] = useState<string | undefined>();
    const [selectedABN, setSelectedABN] = useState<string | undefined>();
    const [selectedCRMGuid, setSelectedCRMGuid] = useState<string | undefined>();
    const [branches, setBranches] = useState<OrganisationDto[] | undefined>();
    const branchModalMessage = setNotification();
    const accountState = useAccountState();
    const accountDispatch = useAccountDispatch();
    const modalState = useModalState();
    const modalDispatch = useModalDispatch();
    const [sortConfig, setSortConfig] = useState<{ key: SortableBranchKey | null; direction: 'asc' | 'desc' }>({ key: 'branchOrLocationName', direction: 'asc' });

    const defaultOrganisationIdSet = hasDefaultOrganisationId(accountState?.details?.defaultOrganisationId);
    const branchSelectionModalMode = modalState?.branchSelectionModalMode;

    const navigate = useNavigate();

    const onContinueBranchSelectorModal = async () => {
        if (inProgress === InteractionStatus.None && accounts.length > 0) {
            setIsSaving(true);
            let reloadAfterSave = false;
            const client = new UsersClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            try {
                if (branchSelectionModalMode === BranchSelectionModalMode.RFQSelectOrg) {
                    await client.setDefaultOrganisation({ defaultOrganisationId: selectedBranch, rfqId: modalState?.rfqId });
                } else if (branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg) {
                    await client.setDefaultOrganisation({ defaultOrganisationId: selectedBranch });
                }
                // Fix 11 — S3776: replaced inline accountDispatch guard with helper (Fix 4 absorbed)
                applyAccountDispatchUpdates(accountDispatch, selectedBranch, selectedCRMGuid, selectedOrganisation, selectedTradingName, selectedBranchName);
                // Fix 11 — S3776: replaced inline accountCreationCompleted block with helper (Fix 6 absorbed)
                finaliseAccountCreation(accountState, accountDispatch, selectedBranch, selectedCRMGuid, selectedOrganisation, selectedABN);
                reloadAfterSave = branchSelectionModalMode === BranchSelectionModalMode.RFQSelectOrg;
            } catch (error) {
                AppLogger.error('Failed to select organisation', error as Error);
                setSavingBranchSelectorError(true);
            } finally {
                setIsSaving(false);
                modalDispatch?.setShowBranchSelector(false);
                clearBranchModalNotification();
                if (reloadAfterSave) {
                    globalThis.location.reload();
                } else {
                    navigate('/');
                }
            }
        }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>, branchId: number | undefined, organisationName: string | undefined, tradingName: string | undefined, branchName: string | undefined, abn: string | undefined, crmGuid: string | undefined) => {
        setSelectedBranch(branchId);
        setSelectedOrganisation(organisationName);
        setSelectedTradingName(tradingName);
        setSelectedBranchName(branchName);
        setSelectedABN(abn);
        setSelectedCRMGuid(crmGuid);
    };

    useEffect(() => {
        let isActive = true;

        const loadBranches = async () => {
            // Fix 5 — S6582: Optional chain collapse
            if (accountState?.details?.abn) {
                const client = new OrganisationsClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                client.setAuthToken(tokenResult.accessToken);

                try {
                    setIsModalDataLoading(true); // Modal data
                    const result = await client.getOrganisationsByABN(accountState.details?.abn, true);
                    if (!isActive) return;

                    setBranches(result);
                    if (hasDefaultOrganisationId(accountState.details?.defaultOrganisationId)) {
                        setSelectedBranch(accountState.details?.defaultOrganisationId);
                        setSelectedCRMGuid(accountState.details?.organisationCRMGuid);
                        setSelectedTradingName(accountState.details?.trading);
                        setSelectedBranchName(accountState.details?.branch);
                    } else {
                        setSelectedBranch(result[0].organisationId);
                        setSelectedTradingName(result[0].businessOrTradingName);
                        setSelectedBranchName(result[0].branchOrLocationName);
                        setSelectedABN(result[0].abn);
                        setSelectedCRMGuid(result[0].crmGuid);
                    }
                    setSelectedOrganisation(result[0].name);
                } catch (error) {
                    if (!isActive) return;

                    AppLogger.error('Failed to load branches', error as Error);
                    setSavingBranchSelectorError(true);
                } finally {
                    if (isActive) {
                        setIsModalDataLoading(false);
                    }
                }
            }
        };

        void loadBranches();

        return () => {
            isActive = false;
        };
    }, [accountState, accounts, instance, accountState?.details?.defaultOrganisationId]);

    const handleClose = () => {
        modalDispatch?.setShowBranchSelector(false);
        clearBranchModalNotification();
    };

    const saveButton = () => (
        <SaveButton onClick={onContinueBranchSelectorModal} />
    );

    const closeButton = () => (
        <Button
            data-testid='exit-portal-button'
            onClick={handleClose}
            variant='tertiary'
            className='me-md-auto order-2 order-md-0'
        >
            {/* Fix 10 — S6772: JSX spacing fix for icon followed by text */}
            <i className='icon-close me-1' aria-hidden='true' />
            {' Cancel'}
        </Button>
    );

    const sortData = (key: SortableBranchKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        const sorted = branches?.sort((a, b) => {
            const aValue = toSortableText(a[key]);
            const bValue = toSortableText(b[key]);

            const comparison = aValue.localeCompare(bValue);
            return direction === 'asc' ? comparison : -comparison;
        });

        setBranches(sorted);
        setSortConfig({ key, direction });
    };

    const getArrow = (key: SortableBranchKey) => {
        if (sortConfig.key !== key) {
            return (
                // Fix 8 — S6819: role='presentation' removed (aria-hidden already present)
                <i className='icon-chevron-up text-muted' aria-hidden='true' />
            );
        }
        return sortConfig.direction === 'asc'
            // Fix 8 — S6819: role='presentation' removed
            ? <i className='icon-chevron-down text-primary' aria-hidden='true' />
            : <i className='icon-chevron-up text-primary' aria-hidden='true' />;
    };

    return (
        <Modal
            size='lg'
            show={modalState?.showBranchSelector}
            aria-labelledby='modal-select-branch'
            enforceFocus={modalState?.showBranchSelector}
            aria-live='assertive'
            // aria-atomic='true'
            tabIndex={-1}
            backdrop='static'
            keyboard={false}
            data-testid='prompt-branchselector-modal'
            onHide={handleClose}
        >
            <Modal.Header closeButton={defaultOrganisationIdSet}>
                {branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg && (
                    <Modal.Title
                        id='modal-select-branch'
                        as='h3'
                    >
                        {'Manage your branch or location '}
                    </Modal.Title>
                )}
                {branchSelectionModalMode === BranchSelectionModalMode.RFQSelectOrg && (
                    <Modal.Title
                        id='modal-select-branch'
                        as='h3'
                    >
                        {'Change branch/location '}
                    </Modal.Title>
                )}
            </Modal.Header>
            <Modal.Body>
                {branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg && (
                    <Row>
                        <Col>
                            <p>
                                Branches or locations are available for your organisation and can be used to help manage NMI Services portal requests.
                            </p>
                            <p className='mb-0'>With this interface, you can:</p>
                            <ul className='mb-4'>
                                <li>
                                    <strong>Change</strong>
                                    {' the currently managed branch or location'}
                                </li>
                                <li>
                                    <strong>Edit</strong>
                                    {' details for any branch or location'}
                                </li>
                                <li>
                                    <strong>Add</strong>
                                    {' a new branch or location'}
                                </li>
                                <li>
                                    <strong>Cancel</strong>
                                    {' anytime without saving changes'}
                                </li>
                            </ul>
                        </Col>
                    </Row>
                )}
                {branchSelectionModalMode === BranchSelectionModalMode.RFQSelectOrg && (
                    <Row>
                        <Col>
                            <p>
                                <strong>Select default branch or location name to manage</strong>
                            </p>
                        </Col>
                    </Row>
                )}
                <SavingBranchSelectorError showError={savingBranchSelectorError} />
                {showBranchModalMessage(branchModalMessage)}
                <Row className='mb-4'>
                    <Col>
                        <div
                            aria-labelledby='caption-org-select-list'
                        >
                            {/* Fix 9 — S6842: role='radiogroup' removed from fieldset (implicit group semantics) */}
                            <fieldset
                                className='w-100'
                            >
                                <legend className='h4 visually-hidden'>
                                    {'Select a branch or location to view currently managing, edit or add a new one for '}
                                </legend>
                                <p>
                                    {'Entity name: '}
                                    <strong>
                                        {selectedOrganisation}
                                    </strong>
                                </p>
                                <Table
                                    id='select-org-table'
                                    data-testid='select-org-table'
                                    className='table-sm table-responsive-stack small mb-0'
                                    aria-live='off'
                                >
                                    <caption id='caption-org-select-list' className='visually-hidden'>
                                        Add, edit or choose your default branch/location from the table list for this organisation
                                        (column headers with buttons are sortable).
                                    </caption>
                                    <thead key='headKeyForThead'>
                                        <tr className='table-active'>
                                            <th
                                                scope='col'
                                                aria-sort={sortConfig.direction === 'asc' ? 'ascending' : 'descending'}
                                                className='w-50 align-middle sortable-column'
                                            >
                                                <span className='visually-hidden text-nowrap'>Set as default</span>
                                                <Button
                                                    variant='flat'
                                                    data-column-index='0'
                                                    onClick={() => sortData('businessListName')}
                                                    className='ms-2 p-0 px-2 body-text fs-6 fw-bold'
                                                    title='Change sort order'
                                                >
                                                    <span className='me-2'>
                                                        Branch/location name
                                                    </span>
                                                    {/* Fix 8 — S6819: role='presentation' removed from span-wrapped <i> */}
                                                    <span className='sort-arrow' aria-hidden='true'>{getArrow('businessListName')}</span>
                                                </Button>
                                            </th>
                                            <th scope='col' className='w-50 align-middle text-nowrap'>Location</th>
                                            {branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg && (
                                                <th scope='col' className='align-middle text-nowrap'><span className='visually-hidden'>Action</span></th>
                                            )}
                                        </tr>
                                    </thead>
                                    {isModalDataLoading
                                        ? (
                                            <tbody key='tBodyKey'>
                                                <tr>
                                                    <td colSpan={3}>
                                                        <BlockUISpinner partial>
                                                            <p>Loading data...</p>
                                                        </BlockUISpinner>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        )
                                        : (
                                            <>
                                                {branches !== undefined && branches?.length > 0 ? (
                                                    <tbody key='tBodyKey'>
                                                        {branches.map((branch, index) => (
                                                            <tr key={branch.organisationId}>
                                                                <td className='pe-0' data-header='Set as default'>
                                                                    {/* To do - replace this with RadioButton component */}
                                                                    <div className='form-field-container mb-0' tabIndex={-1}>
                                                                        <div className='radio-button'>
                                                                            <input
                                                                                type='radio'
                                                                                id={`branch${index}`}
                                                                                name='branchSelector'
                                                                                value={branch.organisationId}
                                                                                checked={branch.organisationId === selectedBranch}
                                                                                onChange={
                                                                                    (e) => handleChange(e, branch.organisationId, branch.name, branch.businessOrTradingName, branch.branchOrLocationName, branch.abn, branch.crmGuid)
                                                                                }
                                                                            />
                                                                            <label htmlFor={`branch${index}`} className='form-field flex-column' title='Set as default'>
                                                                                {/* <span className='visually-hidden'>
                                                                                    {'Set as default '}
                                                                                </span> */}
                                                                                <span className='text-break'>{branch.businessListName}</span>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td data-header='Location' className='text-break'>
                                                                    <span>
                                                                        {`${branch.streetAddress?.suburb}, ${branch.streetAddress?.state}`}
                                                                    </span>
                                                                </td>
                                                                {branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg && (
                                                                    <td>
                                                                        <span>
                                                                            <Link
                                                                                to={`/update-organisation/${branch.organisationId}`}
                                                                                onClick={handleClose}
                                                                                aria-label='Edit details for this branch/location'
                                                                            >
                                                                                Edit
                                                                            </Link>
                                                                        </span>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                ) : (
                                                    <tbody key='tBodyKey'>
                                                        <tr>
                                                            <td colSpan={3}>No branch/locations available. Please create a new one.</td>
                                                        </tr>
                                                    </tbody>
                                                )}
                                            </>
                                        )}

                                </Table>
                            </fieldset>
                        </div>
                    </Col>
                </Row>
                {branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg && (
                    <Row>
                        <Col>
                            <Link
                                data-testid='open-branch-add-button'
                                to='/add-branch'
                                className='btn btn-flat btn-tertiary'
                                onClick={handleClose}
                            >
                                {/* Fix 10 — S6772: JSX spacing fix for icon followed by bare text */}
                                <i className='icon-add fs-2 me-2' aria-hidden='true' />
                                {' Add branch or location'}
                            </Link>
                        </Col>
                    </Row>
                )}
                {isSaving && (
                    <BlockUISpinner>
                        <p>Saving...</p>
                    </BlockUISpinner>
                )}
            </Modal.Body>
            <Modal.Footer className='d-inline'>
                <BranchSelectorButtons
                    left={() => defaultOrganisationIdSet && closeButton()}
                    right={() => saveButton()}
                />
            </Modal.Footer>
        </Modal>
    );
};

export default BranchSelectorModal;
