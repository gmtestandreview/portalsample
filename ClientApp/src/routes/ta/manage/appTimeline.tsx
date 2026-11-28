import { useState } from 'react';
import { Button, Col, Collapse, Row } from 'react-bootstrap';

const ApplicationTimeline = () => {
  const [openRecent, setOpenRecent] = useState(true);

  return (
    <Row id='application-timeline-recent' className='timeline-items mb-4'>
      <Col>
        <section className='recent-details'>
          <Button
            id='recent-timeline-toggle'
            variant='tertiary'
            className='d-flex align-items-center mb-3'
            onClick={() => {
              setOpenRecent((isOpen) => !isOpen);
            }}
            aria-controls='recent-collapse-section'
            aria-expanded={openRecent}
            title='Click to expand/collapse recent timeline'
          >
            <i className='icon-chevron-right me-2 p-2' aria-hidden='true' />
            <span>Recent</span>
          </Button>
          <Collapse in={openRecent} className='-details-text'>
            <div id='recent-collapse-section'>
              <div className='ms-5 py-2'>
                <p>
                  <strong>
                    No information is available for this section at this time.
                  </strong>
                </p>
              </div>
            </div>
          </Collapse>
        </section>
      </Col>
    </Row>
  );
};

export default ApplicationTimeline;
