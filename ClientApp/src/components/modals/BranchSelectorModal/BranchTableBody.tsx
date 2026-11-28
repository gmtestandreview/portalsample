import { Link } from 'react-router';
import type { OrganisationDto } from '../../../api/web-api-client';
import BlockUISpinner from '../../BlockUISpinner';
import type { useBranchSelection } from './useBranchSelection';

type HandleBranchChange = ReturnType<typeof useBranchSelection>['handleChange'];

interface BranchTableRowProps {
  branch: OrganisationDto;
  index: number;
  selectedBranch: number | undefined;
  showEditColumn: boolean;
  onChange: HandleBranchChange;
  onClose: () => void;
}

const BranchTableRow = ({
  branch,
  index,
  selectedBranch,
  showEditColumn,
  onChange,
  onClose,
}: BranchTableRowProps) => (
  <tr>
    <td className='pe-0' data-header='Set as default'>
      {/* To do - replace this with RadioButton component */}
      <div className='form-field-container mb-0' tabIndex={-1}>
        <div className='radio-button'>
          <input
            type='radio'
            id={`branch${index}`}
            name='branchSelector'
            value={branch.organisationId}
            checked={
              branch.organisationId !== undefined &&
              branch.organisationId === selectedBranch
            }
            onChange={(e) => {
              onChange(
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
            <span className='text-break'>{branch.businessListName}</span>
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
    {showEditColumn && (
      <td>
        <span>
          {branch.organisationId !== undefined && (
            <Link
              to={`/update-organisation/${branch.organisationId}`}
              onClick={onClose}
              aria-label='Edit details for this branch/location'
            >
              Edit
            </Link>
          )}
        </span>
      </td>
    )}
  </tr>
);

interface BranchTableBodyProps {
  isLoading: boolean;
  branches: OrganisationDto[] | undefined;
  selectedBranch: number | undefined;
  showEditColumn: boolean;
  onChange: HandleBranchChange;
  onClose: () => void;
}

const BranchTableBody = ({
  isLoading,
  branches,
  selectedBranch,
  showEditColumn,
  onChange,
  onClose,
}: BranchTableBodyProps) => {
  if (isLoading) {
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
          <BranchTableRow
            key={branch.organisationId}
            branch={branch}
            index={index}
            selectedBranch={selectedBranch}
            showEditColumn={showEditColumn}
            onChange={onChange}
            onClose={onClose}
          />
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

export default BranchTableBody;
