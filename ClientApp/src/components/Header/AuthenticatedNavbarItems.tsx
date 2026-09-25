import { Dropdown } from 'react-bootstrap';
import { Link } from 'react-router';
import { trackGAEvent } from '../../analytics/GoogleAnalytics';
import { useAccountState } from '../../authentication/hooks';
import { useModalDispatch } from '../modals/ModalContext';

const DisplayUserAndOrgName = () => {
    const account = useAccountState();
    return (
        <>
            <span className='d-block user-name fw-bold text-break'>
                <span className='visually-hidden'>{'User signed in as: '}</span>
                {account?.details?.givenName}
                {' '}
                {account?.details?.familyName}
                <span className='visually-hidden'>,</span>
            </span>
            <span className='d-block org-name text-break'>
                {!!(account?.details?.trading) && (`${account?.details?.trading}`)}
                {!!(account?.details?.trading) && !!(account?.details?.branch) && (' - ')}
                {!!(account?.details?.branch) && (`${account?.details?.branch}`)}
            </span>
            <span className='d-block org-name text-break'>
                {account?.details?.organisation}
            </span>
        </>
    );
};

const AuthenticatedNavbarItems = () => {
    const accountState = useAccountState();
    const modalDispatch = useModalDispatch();

    if (!accountState?.details?.email) {
        return null;
    }

    const onShowBranchSelectorClick = () => { modalDispatch?.setShowBranchSelector(true); };

    return (
        <Dropdown
            align='end'
            id='user-menu-dropdown'
            data-testid='user-menu-dropdown'
        >
            <Dropdown.Toggle
                id='user-menu'
                variant='dark'
            >
                <h2 className='visually-hidden text-white'>Current user settings menu</h2>
                <div className='d-none d-md-block text-end me-2'>
                    <DisplayUserAndOrgName />
                </div>
            </Dropdown.Toggle>
            <Dropdown.Menu variant='dark'>
                <Dropdown.ItemText className='d-block d-md-none'>
                    <DisplayUserAndOrgName />
                </Dropdown.ItemText>
                <Dropdown.Item
                    as={Link}
                    to={`/update-organisation/${accountState?.details?.defaultOrganisationId}`}
                    onClick={() => { trackGAEvent('Manage organisation'); }}
                >
                    Manage organisation
                </Dropdown.Item>
                <Dropdown.Item
                    as={Link}
                    onClick={() => {
                        onShowBranchSelectorClick();
                        trackGAEvent('Manage branch/location');
                    }}
                    to='/dashboard#0'
                >
                    Add or manage branch/location
                </Dropdown.Item>
                <Dropdown.Item
                    as={Link}
                    to='/update-contact'
                    onClick={() => { trackGAEvent('Manage contact'); }}
                >
                    My contact details
                </Dropdown.Item>
                <Dropdown.Item
                    as={Link}
                    to='/sign-out'
                    onClick={() => { trackGAEvent('sign out'); }}
                >
                    Log out
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default AuthenticatedNavbarItems;
