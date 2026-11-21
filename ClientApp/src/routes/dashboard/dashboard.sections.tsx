import { Col, Row } from 'react-bootstrap';
import StandardPathway from '../../components/tiles/StandardPathway';

export const DashboardQuickLinks = () => (
  <Row className='mb-5'>
    <h2 className='pt-md-4 mb-3'>Quick links</h2>
    <Col md>
      <StandardPathway
        type='internal'
        title='Services we offer'
        linkDescription=' '
        bodyText='The National Measurement Institute (NMI) offers a range of service. Find out more...'
        to='/services-we-offer'
      />
    </Col>
    <Col md>
      <StandardPathway
        type='internal'
        title='Help guide'
        linkDescription=' '
        bodyText='View help guides for common issues and troubleshooting tips'
        to='/help-guide'
      />
    </Col>
    <Col md>
      <StandardPathway
        type='external'
        title='Give us your feedback'
        linkDescription=' '
        bodyText='Your feedback about using the portal is important to us. Please take the time to let us know your experience.'
        linkHref='https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu'
        target='_blank'
      />
    </Col>
  </Row>
);
