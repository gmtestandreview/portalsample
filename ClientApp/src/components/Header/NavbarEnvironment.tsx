import { getEnvironment } from '../../routes/common/helperFunctions';

const NavbarEnvironment = () => {
    if (getEnvironment() !== '') {
        return (
            <span className='envBox envInfo' data-testid='header-environment' aria-hidden='true'>
                Environment:
                {getEnvironment()}
            </span>
        );
    }

    return null;
};

export default NavbarEnvironment;
