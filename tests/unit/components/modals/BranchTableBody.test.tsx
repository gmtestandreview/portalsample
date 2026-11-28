import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { State, type OrganisationDto } from '@/api/web-api-client';
import BranchTableBody from '@/components/modals/BranchSelectorModal/BranchTableBody';
import { defined } from '../../helpers/defined';

type BranchTableBodyProps = Parameters<typeof BranchTableBody>[0];
type HandleBranchChange = BranchTableBodyProps['onChange'];

const sydneyBranch: OrganisationDto = {
  organisationId: 1,
  name: 'Acme Pty Ltd',
  businessOrTradingName: 'Acme Trading',
  branchOrLocationName: 'Head Office',
  abn: '11111111111',
  crmGuid: 'crm-guid-1',
  businessListName: 'Acme Pty Ltd - Head Office',
  streetAddress: { suburb: 'Sydney', state: State.NSW },
};

const unlocatedBranch: OrganisationDto = {
  organisationId: 2,
  name: 'Acme Pty Ltd',
  businessOrTradingName: 'Acme Trading',
  branchOrLocationName: 'Remote',
  abn: '11111111111',
  crmGuid: 'crm-guid-2',
  businessListName: 'Acme Pty Ltd - Remote',
};

const unsavedBranch: OrganisationDto = {
  name: 'Acme Pty Ltd',
  businessListName: 'Acme Pty Ltd - Unsaved',
};

const renderBody = (overrides: Partial<BranchTableBodyProps> = {}) => {
  const props: BranchTableBodyProps = {
    isLoading: false,
    branches: [sydneyBranch, unlocatedBranch],
    selectedBranch: undefined,
    showEditColumn: true,
    onChange: vi.fn<HandleBranchChange>(),
    onClose: vi.fn<() => void>(),
    ...overrides,
  };

  render(
    <MemoryRouter>
      <table>
        <BranchTableBody {...props} />
      </table>
    </MemoryRouter>,
  );

  return { onChange: props.onChange, onClose: props.onClose };
};

// function suite titles are required by vitest/prefer-describe-function-title.
describe(BranchTableBody, () => {
  it('shows a spinner row and no branches while loading', () => {
    expect.hasAssertions();

    renderBody({ isLoading: true });

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/No branch\/locations available/),
    ).not.toBeInTheDocument();
  });

  it('prefers the loading state over any branches already held', () => {
    expect.hasAssertions();

    renderBody({ isLoading: true, branches: [sydneyBranch] });

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it.each([
    ['undefined', undefined],
    ['empty', []],
  ] satisfies [string, OrganisationDto[] | undefined][])(
    'prompts to create a branch when the list is %s',
    (_label, branches) => {
      expect.hasAssertions();

      renderBody({ branches });

      expect(
        screen.getByText(
          'No branch/locations available. Please create a new one.',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    },
  );

  it('renders one selectable row per branch with its location', () => {
    expect.hasAssertions();

    renderBody({ selectedBranch: 1 });

    const [sydneyRadio, unlocatedRadio] = screen.getAllByRole('radio');

    expect(sydneyRadio).toBeChecked();
    expect(unlocatedRadio).not.toBeChecked();
    expect(sydneyRadio).toHaveAttribute('id', 'branch0');
    expect(unlocatedRadio).toHaveAttribute('id', 'branch1');
  });

  it('shows the location only for branches that have a street address', () => {
    expect.hasAssertions();

    renderBody();

    expect(screen.getByText('Acme Pty Ltd - Head Office')).toBeInTheDocument();
    expect(screen.getByText('Sydney, NSW')).toBeInTheDocument();

    const unlocatedRow = screen
      .getByText('Acme Pty Ltd - Remote')
      .closest('tr');

    expect(unlocatedRow).not.toBeNull();
    expect(
      within(unlocatedRow as HTMLElement).queryByText(/,/),
    ).not.toBeInTheDocument();
  });

  it('reports the full branch details when a different branch is chosen', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const { onChange } = renderBody({ selectedBranch: 1 });

    await user.click(defined(screen.getAllByRole('radio')[1]));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'change' }),
      2,
      'Acme Pty Ltd',
      'Acme Trading',
      'Remote',
      '11111111111',
      'crm-guid-2',
    );
  });

  it('links each saved branch to its edit page and closes the modal when followed', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const { onClose } = renderBody();

    const editLinks = screen.getAllByRole('link', {
      name: 'Edit details for this branch/location',
    });

    expect(editLinks).toHaveLength(2);
    expect(editLinks[0]).toHaveAttribute('href', '/update-organisation/1');
    expect(editLinks[1]).toHaveAttribute('href', '/update-organisation/2');

    await user.click(defined(editLinks[0]));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not select an unsaved branch or show its edit link', () => {
    expect.hasAssertions();

    renderBody({ branches: [unsavedBranch] });

    expect(screen.getByRole('radio')).not.toBeChecked();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('omits the edit column when editing is not allowed', () => {
    expect.hasAssertions();

    renderBody({ showEditColumn: false });

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getAllByRole('cell')).toHaveLength(4);
  });
});
