import {
    Button, Container, Nav, Navbar,
} from 'react-bootstrap';
import { useNavigate } from 'react-router';
import type { FormBannerProps } from './types';
import SaveAndExitButton from '../SaveAndExitButton';
import LinkButton from '../../Buttons/LinkButton';
import SkipLinks from '../../Utilities/skipLinks';
import NavbarMessage from '../../Header/NavbarMessage';

const FormBanner = ({
    title,
    refTitle,
    subTitle,
    showSaveAndExitButton,
    showGoToDashboardButton,
    discard,
} : FormBannerProps) => {
    const locationOnDiscard = discard?.locationOnDiscard ?? '/';
    const onDiscard = discard?.onDiscard;
    const discardButtonTitle = discard?.discardButtonTitle ?? 'Discard changes';
    const showDiscardButton = discard !== undefined;

    const navigate = useNavigate();

    const onClick = () => {
        if (onDiscard) {
            onDiscard();
        }

        navigate(locationOnDiscard);
    };

    return (
        <>
            <SkipLinks />
            <header id='header'>
                <NavbarMessage />
                <Navbar bg='nmi-form-navbar' collapseOnSelect expand='lg' aria-labelledby='form-banner'>
                    <Container fluid className='container-lg align-items-stretch p-0'>
                        <Navbar.Brand
                            as='div'
                            id='form-banner'
                            bsPrefix='nmi-form-brand d-flex align-items-center'
                        >
                            <div className='form-banner-title'>
                                <span className='d-block'>
                                    {title}
                                    {refTitle !== null && refTitle !== ''
                                        ? (
                                            <span className='ref-title d-block d-sm-inline ms-sm-2 text-nowrap'>
                                                {refTitle}
                                            </span>
                                        )
                                        : null }
                                </span>
                                {subTitle !== null && subTitle !== ''
                                    ? (
                                        <span className='org-title d-block'>
                                            {subTitle}
                                        </span>
                                    )
                                    : null }
                            </div>
                        </Navbar.Brand>
                        {showSaveAndExitButton === true || showDiscardButton === true
                            ? (
                                <>
                                    <Navbar.Toggle aria-controls='form-navbar' />
                                    <Navbar.Collapse className='p-4'>
                                        <Nav
                                            id='form-navbar'
                                            role='toolbar'
                                            navbar
                                            className='d-grid gap-3 d-lg-block ms-auto me-0 p-3 p-lg-0 text-nowrap'
                                            aria-labelledby='form-navbar-title'
                                        >
                                            <h2 id='form-navbar-title' className='visually-hidden'>Form actions</h2>
                                            {showSaveAndExitButton === true ? <SaveAndExitButton /> : null}
                                            {showDiscardButton === true
                                                ? (
                                                    <Button
                                                        data-testid='discard-changes-button'
                                                        onClick={() => onClick()}
                                                        variant='tertiary-colorbg'
                                                    >
                                                        <i className='icon-close me-1' aria-hidden='true' />
                                                        {discardButtonTitle}
                                                    </Button>
                                                ) : null}
                                        </Nav>
                                    </Navbar.Collapse>
                                </>
                            ) : null}
                        {showGoToDashboardButton === true
                            ? (
                                <>
                                    <Navbar.Toggle aria-controls='form-navbar' />
                                    <Navbar.Collapse className='p-4'>
                                        <Nav
                                            id='form-navbar'
                                            role='toolbar'
                                            navbar
                                            className='d-grid gap-3 d-lg-block ms-auto me-0 p-3 p-lg-0'
                                            aria-labelledby='form-navbar-title'
                                        >
                                            <h2 id='form-navbar-title' className='visually-hidden'>Form actions</h2>
                                            <div className='d-grid d-lg-block'>
                                                <LinkButton
                                                    data-testid='form-go-to-dashboard-portal-button'
                                                    to='/dashboard'
                                                    variant='tertiary-colorbg'
                                                    as='Link'
                                                >
                                                    <i className='icon-arrow-right me-1' aria-hidden='true' />
                                                    {'Go to dashboard'}
                                                </LinkButton>
                                            </div>
                                        </Nav>
                                    </Navbar.Collapse>
                                </>
                            ) : null}
                    </Container>
                </Navbar>
            </header>
        </>
    );
};

export default FormBanner;
