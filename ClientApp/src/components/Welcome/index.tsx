import { Container, Row, Col } from 'react-bootstrap';
import { useAccountState } from '../../authentication/hooks';

const Welcome = () => {
    const accountContext = useAccountState();
    const givenName = accountContext?.details?.givenName;

    return (
            <Container fluid className='welcome-banner-background gs-wrapper mb-5' data-testid='welcome-banner'>
            <Container>
                <Row>
                <Col lg={9} data-testid='welcome-banner-username'>
                    <h1
                        id='page-title-nofocus'
                        tabIndex={-1}
                        className='banner-title mb-0'
                        aria-label={givenName ? `Welcome ${givenName}` : 'Welcome'}
                    >
                    <span className='d-block'>Welcome</span>
                    {givenName ? (
                        <span className='d-block'>{givenName}</span>
                    ) : null}
                    </h1>
                </Col>
                </Row>
            </Container>
            </Container>
    );
};

export default Welcome;
