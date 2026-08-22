import {
    Col, Row,
} from 'react-bootstrap';
import { Link } from 'react-router';
import HeaderIntroText from '../HeaderIntroText';

interface NoRequestsProps {
    serviceType?: string;
    serviceName?: string;
    serviceNameLinkTitle?: string;
    serviceNameLinkUrl?: string;
}

const NoRequests = ({ serviceName, serviceNameLinkTitle, serviceNameLinkUrl }: NoRequestsProps = {}) => (
    <Row className='mb-3'>
        <Col>
            <HeaderIntroText className='p-4'>
                <span>
                    <i className='icon-warning me-2 text-muted' aria-hidden='true' />
                </span>
                <span>
                    {`You currently have no ${serviceName ?? 'requests'}, please adjust your search filter options or create a `}
                    <Link
                        data-testid='new-request-link'
                        to={serviceNameLinkUrl ?? '/services-we-offer'}
                    >
                        {serviceNameLinkTitle ?? 'new request'}
                    </Link>
                    .
                </span>
            </HeaderIntroText>
        </Col>
    </Row>
);

export default NoRequests;
