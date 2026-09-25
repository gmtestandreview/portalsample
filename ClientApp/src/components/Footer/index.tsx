import { useState } from 'react';
import { Button, Container } from 'react-bootstrap';
import CoatOfArms from '../../assets/GovCrest.svg';
import LinkButton from '../Buttons/LinkButton';
import ContentModal from '../modals/ContentModal';
import TermsOfUse from './termsOfUse';
import Privacy from './privacy';
import Accessibility from './accessibility';

const Footer = () => {
    const [termsDialogOpen, setTermsDialogOpen] = useState(false);
    const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
    const [accessibilityDialogOpen, setAccessibilityDialogOpen] = useState(false);

    const onTermsDialog = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        setTermsDialogOpen(true);
    };

    const onTermsDialogClose = () => {
        setTermsDialogOpen(false);
    };

    const onPrivacyDialog = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        setPrivacyDialogOpen(true);
    };

    const onPrivacyDialogClose = () => {
        setPrivacyDialogOpen(false);
    };

    const onAccessibilityDialog = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        setAccessibilityDialogOpen(true);
    };

    const onAccessibilityDialogClose = () => {
        setAccessibilityDialogOpen(false);
    };

    return (
        <>
            <footer id='footer' data-testid='nmi-footer' className='footer py-5 nmi-footer'>
                <h2 className='visually-hidden text-white'>Site footer</h2>
                <Container>
                    <img src={CoatOfArms} alt='Australian Government Coat of Arms' />
                    <div className='my-5'>
                        <p className='mb-4 text-white'>
                            We acknowledge the traditional owners of the country throughout Australia and their continuing connection to land, sea and community.
                            <br />
                            We pay our respect to them and their cultures and to the elders past and present.
                        </p>
                        <p className='text-white'>&copy; Commonwealth of Australia.</p>
                    </div>
                    <div className='links-block'>
                        <div className='links-block-row'>
                            <ul className='text-left'>
                                <li>
                                    <Button
                                        data-testid='open-termsofuse-button'
                                        onClick={onTermsDialog}
                                        variant='link'
                                        className='link-text'
                                        type='button'
                                    >
                                        Terms of use
                                    </Button>
                                </li>
                                <li>
                                    <Button
                                        data-testid='open-privacy-button'
                                        onClick={onPrivacyDialog}
                                        variant='link'
                                        className='link-text'
                                        type='button'
                                    >
                                        Privacy
                                    </Button>
                                </li>
                                <li>
                                    <Button
                                        data-testid='open-accessibility-button'
                                        onClick={onAccessibilityDialog}
                                        variant='link'
                                        className='link-text'
                                        type='button'
                                    >
                                        Accessibility
                                    </Button>
                                </li>
                                <li>
                                    <LinkButton
                                        data-testid='open-help-guide-button'
                                        href='/help-guide'
                                        variant='link'
                                        className='link-text'
                                        as='a'
                                    >
                                        Help guide
                                    </LinkButton>
                                </li>
                                {/* <li>
                                    <LinkButton
                                        data-testid='open-contact-us-button'
                                        href='https://www.industry.gov.au/national-measurement-institute#contact-footer'
                                        variant='link'
                                        target='_blank'
                                        className='link-text'
                                        as='a'
                                    >
                                        Contact us
                                        <ExternalLinkIcon />
                                        <span className='visually-hidden'> Opens in a new tab</span>
                                    </LinkButton>
                                </li> */}
                            </ul>
                        </div>
                    </div>
                </Container>
            </footer>
            <ContentModal
                showModal={termsDialogOpen}
                onCancelModal={onTermsDialogClose}
                modalBody={TermsOfUse()}
                modalTitle='Portal Terms of Use'
            />
            <ContentModal
                showModal={privacyDialogOpen}
                onCancelModal={onPrivacyDialogClose}
                modalBody={Privacy()}
                modalTitle='Privacy collection statement'
            />
            <ContentModal
                showModal={accessibilityDialogOpen}
                onCancelModal={onAccessibilityDialogClose}
                modalBody={Accessibility()}
                modalTitle='Accessibility'
            />
            {/* <ContentModal
                showModal={disclaimerDialogOpen}
                onCancelModal={onDisclaimerDialogClose}
                modalBody={Disclaimer()}
                modalTitle='Disclaimer'
            /> */}
        </>
    );
};
export default Footer;
