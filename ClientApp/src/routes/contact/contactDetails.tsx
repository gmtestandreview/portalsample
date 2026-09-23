import { Alert } from 'react-bootstrap';
import Row from 'react-bootstrap/Row';
import ContactDetailsInput from '../../components/forms/CommonForms/ContactDetails/index.tsx';

const getContactFieldName = (localName: string) => `${localName}`;

const ContactDetails = () => (
  <>
    <Alert
      variant='info'
      data-testid='info-summary'
      role='status'
      aria-live='polite'
      className='d-flex mb-4'
    >
      <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
        <div className='bgCircle mb-3 me-3'>
          <i className='icon-info' aria-hidden='true' />
        </div>
      </div>
      <div>
        <p className='mb-0'>
          <strong>Important information</strong>
        </p>
        <p>
          Your contact details are the stored contact information which can be
          used for new request that you submit on this portal.
        </p>
      </div>
    </Alert>
    <Row className='mb-4'>
      <h2 className='mb-2 h3'>Contact</h2>
      <p className='mb-4'>Please fill out your contact details</p>
      <ContactDetailsInput
        key='contact'
        name={getContactFieldName('contact')}
        roleLabel='Role (optional)'
      />
    </Row>
  </>
);

export default ContactDetails;
