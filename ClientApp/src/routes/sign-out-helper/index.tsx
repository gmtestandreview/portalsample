import {
    Button,
    Col,
    Container,
    Row,
} from 'react-bootstrap';
import useBodyClass from '../../components/Utilities/useBodyClass';
import useHtmlTitle from '../../components/Utilities/useHtmlTitle';
import BodyText from '../../components/BodyText';

const SignoutHelper = () => {
    useHtmlTitle('NMI Services portal | NMI');
    useBodyClass('home');

    return (
        <Container>
            <Row className='mt-5 mb-3'>
                <Col md={12} lg={9}>
                    <h1 id='page-title-nofocus' tabIndex={-1} className='banner-title mb-0'>
                        Warning: To complete your log out, close your browser window
                    </h1>
                </Col>
            </Row>
            <Row>
                <Col md={12} lg={9}>
                    <BodyText className='col-12 col-lg-9'>
                        Please close your browser in order to complete the Digital ID log out.
                    </BodyText>
                </Col>
            </Row>
            <Row>
                <Col md={12} lg={9}>
                    <Button
                        variant='primary'
                        data-testid='back-to-nmi-org-button'
                        className='ms-md-auto'
                        href='https://measurement.gov.au'
                    >
                        Exit portal
                    </Button>
                </Col>
            </Row>
        </Container>
    );
};

export default SignoutHelper;
