import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Modal, Row, Col, Table } from 'react-bootstrap';
import { useAccountState } from '../../../authentication/hooks';
import { useModalState, useModalDispatch } from '../ModalContext';
import BlockUISpinner from '../../BlockUISpinner';
import { clearBranchModalNotification } from '../../../storage/notification';
import { BranchSelectionModalMode } from './enums';
import { omitUndefined } from '../../../utils/omitUndefined';
import BranchSelectorButtons from './BranchSelectorButtons';
import SavingBranchSelectorError from './SavingBranchSelectorError';
import { useBranchSelection } from './useBranchSelection';
import { useSaveBranchSelection } from './useSaveBranchSelection';
import {
  hasDefaultOrganisationId,
  setNotification,
  showBranchModalMessage,
} from './branchSelectorHelpers';
import type { SortableBranchKey } from './branchSelectorHelpers';

const BranchSelectorModal = () => {
  const [savingBranchSelectorError, setSavingBranchSelectorError] =
    useState(false);
  const branchModalMessage = setNotification();
  const accountState = useAccountState();
  const modalState = useModalState();
  const modalDispatch = useModalDispatch();
  const {
    isModalDataLoading,
    hasLoadError,
    branches,
    sortConfig,
    sortData,
    handleChange,
    selectedBranch,
    selectedOrganisation,
    selectedTradingName,
    selectedBranchName,
    selectedABN,
    selectedCRMGuid,
  } = useBranchSelection();
  const { isSaving, onContinueBranchSelectorModal } = useSaveBranchSelection(
    {
      selectedBranch,
      selectedOrganisation,
      selectedTradingName,
      selectedBranchName,
      selectedABN,
      selectedCRMGuid,
    },
    setSavingBranchSelectorError,
  );

  const defaultOrganisationIdSet = hasDefaultOrganisationId(
    accountState?.details?.defaultOrganisationId,
  );
  const branchSelectionModalMode = modalState?.branchSelectionModalMode;

  const handleClose = () => {
    modalDispatch?.setShowBranchSelector(false);
    clearBranchModalNotification();
  };

  const getArrow = (key: SortableBranchKey) => {
    if (sortConfig.key !== key) {
      return (
        // Fix 8 — S6819: role='presentation' removed (aria-hidden already present)
        <i className='icon-chevron-up text-muted' aria-hidden='true' />
      );
    }
    return sortConfig.direction === 'asc' ? (
      // Fix 8 — S6819: role='presentation' removed
      <i className='icon-chevron-down text-primary' aria-hidden='true' />
    ) : (
      <i className='icon-chevron-up text-primary' aria-hidden='true' />
    );
  };

  const renderTableBody = () => {
    if (isModalDataLoading) {
      return (
        <tbody key='tBodyKey'>
          <tr>
            <td colSpan={3}>
              <BlockUISpinner partial>
                <p>Loading data...</p>
              </BlockUISpinner>
            </td>
          </tr>
        </tbody>
      );
    }
    if (branches !== undefined && branches.length > 0) {
      return (
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
                      onChange={(e) => {
                        handleChange(
                          e,
                          branch.organisationId,
                          branch.name,
                          branch.businessOrTradingName,
                          branch.branchOrLocationName,
                          branch.abn,
                          branch.crmGuid,
                        );
                      }}
                    />
                    <label
                      htmlFor={`branch${index}`}
                      className='form-field flex-column'
                      title='Set as default'
                    >
                      {/* <span className='visually-hidden'>
                                                                                    {'Set as default '}
                                                                                </span> */}
                      <span className='text-break'>
                        {branch.businessListName}
                      </span>
                    </label>
                  </div>
                </div>
              </td>
              <td data-header='Location' className='text-break'>
                <span>
                  {[branch.streetAddress?.suburb, branch.streetAddress?.state]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </td>
              {branchSelectionModalMode ===
                BranchSelectionModalMode.SelectAndEditOrg && (
                <td>
                  <span>
                    {branch.organisationId !== undefined && (
                      <Link
                        to={`/update-organisation/${branch.organisationId}`}
                        onClick={handleClose}
                        aria-label='Edit details for this branch/location'
                      >
                        Edit
                      </Link>
                    )}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      );
    }
    return (
      <tbody key='tBodyKey'>
        <tr>
          <td colSpan={3}>
            No branch/locations available. Please create a new one.
          </td>
        </tr>
      </tbody>
    );
  };

  return (
    <Modal
      size='lg'
      {...omitUndefined({
        show: modalState?.showBranchSelector,
        enforceFocus: modalState?.showBranchSelector,
      })}
      aria-labelledby='modal-select-branch'
      aria-live='assertive'
      // aria-atomic='true'
      tabIndex={-1}
      backdrop='static'
      keyboard={false}
      data-testid='prompt-branchselector-modal'
      onHide={handleClose}
    >
      <Modal.Header closeButton={defaultOrganisationIdSet}>
        {branchSelectionModalMode ===
          BranchSelectionModalMode.SelectAndEditOrg && (
          <Modal.Title id='modal-select-branch' as='h3'>
            {'Manage your branch or location '}
          </Modal.Title>
        )}
        {branchSelectionModalMode === BranchSelectionModalMode.RFQSelectOrg && (
          <Modal.Title id='modal-select-branch' as='h3'>
            {'Change branch/location '}
          </Modal.Title>
        )}
      </Modal.Header>
      <Modal.Body>
        {branchSelectionModalMode ===
          BranchSelectionModalMode.SelectAndEditOrg && (
          <Row>
            <Col>
              <p>
                Branches or locations are available for your organisation and
                can be used to help manage NMI Services portal requests.
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
                <strong>
                  Select default branch or location name to manage
                </strong>
              </p>
            </Col>
          </Row>
        )}
        <SavingBranchSelectorError
          showError={savingBranchSelectorError || hasLoadError}
        />
        {showBranchModalMessage(branchModalMessage)}
        <Row className='mb-4'>
          <Col>
            <div>
              {/* Fix 9 — S6842: role='radiogroup' removed from fieldset (implicit group semantics) */}
              <fieldset className='w-100'>
                <legend className='h4 visually-hidden'>
                  {
                    'Select a branch or location to view currently managing, edit or add a new one for '
                  }
                </legend>
                <p>
                  {'Entity name: '}
                  <strong>{selectedOrganisation}</strong>
                </p>
                <Table
                  id='select-org-table'
                  data-testid='select-org-table'
                  className='table-sm table-responsive-stack small mb-0'
                  aria-live='off'
                >
                  <caption
                    id='caption-org-select-list'
                    className='visually-hidden'
                  >
                    Add, edit or choose your default branch/location from the
                    table list for this organisation (column headers with
                    buttons are sortable).
                  </caption>
                  <thead key='headKeyForThead'>
                    <tr className='table-active'>
                      <th
                        scope='col'
                        aria-sort={
                          sortConfig.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                        }
                        className='w-50 align-middle sortable-column'
                      >
                        <span className='visually-hidden text-nowrap'>
                          Set as default
                        </span>
                        <Button
                          variant='flat'
                          data-column-index='0'
                          onClick={() => {
                            sortData('businessListName');
                          }}
                          className='ms-2 p-0 px-2 body-text fs-6 fw-bold'
                          title='Change sort order'
                        >
                          <span className='me-2'>Branch/location name</span>
                          {/* Fix 8 — S6819: role='presentation' removed from span-wrapped <i> */}
                          <span className='sort-arrow' aria-hidden='true'>
                            {getArrow('businessListName')}
                          </span>
                        </Button>
                      </th>
                      <th scope='col' className='w-50 align-middle text-nowrap'>
                        Location
                      </th>
                      {branchSelectionModalMode ===
                        BranchSelectionModalMode.SelectAndEditOrg && (
                        <th scope='col' className='align-middle text-nowrap'>
                          <span className='visually-hidden'>Action</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  {renderTableBody()}
                </Table>
              </fieldset>
            </div>
          </Col>
        </Row>
        {branchSelectionModalMode ===
          BranchSelectionModalMode.SelectAndEditOrg && (
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
          showCloseButton={defaultOrganisationIdSet}
          onClose={handleClose}
          onSave={() => void onContinueBranchSelectorModal()}
        />
      </Modal.Footer>
    </Modal>
  );
};

export default BranchSelectorModal;
