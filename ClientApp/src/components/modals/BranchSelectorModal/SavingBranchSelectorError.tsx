import type { ReactElement } from 'react';
import { Alert, Row, Col } from 'react-bootstrap';

interface SavingBranchSelectorErrorProps {
  showError: boolean;
}

const SavingBranchSelectorError = (
  props: Readonly<SavingBranchSelectorErrorProps>,
): ReactElement | null => {
  const { showError } = props;
  if (showError) {
    return (
      <Row className='mb-4'>
        <Col>
          <Alert
            variant='danger'
            className='d-flex'
            role='alert'
            aria-live='assertive'
          >
            <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
              <div className='bgCircle me-3'>
                <i className='icon-warning' aria-hidden='true' />
              </div>
            </div>
            <div>
              <p className='mb-3'>
                Error trying to save default branch/location. Try again later!
              </p>
            </div>
          </Alert>
        </Col>
      </Row>
    );
  }
  return null;
};

export default SavingBranchSelectorError;
