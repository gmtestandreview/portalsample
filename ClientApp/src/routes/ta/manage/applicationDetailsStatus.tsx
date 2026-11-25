import { useField } from 'formik';
import type { Dispatch, FC, SetStateAction } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import type { ApplicationDetailsDto } from '../../../api/web-api-client';
import {
  CustomAccordion,
  CustomAccordionBody,
} from '../../../components/Accordion';
import StatusPill from '../../../components/Pill/StatusPill';
import { trackGAEvent } from '../../../analytics/GoogleAnalytics';

interface ApplicationDetailsStatusProps {
  name: string;
  setActiveTab?: Dispatch<SetStateAction<string>>;
  onTabChange?: (key: string | null) => void;
}

const getApplicationDetails = (value: ApplicationDetailsDto | undefined) =>
  value ?? {};

const ApplicationDetailsStatus: FC<ApplicationDetailsStatusProps> = ({
  name,
  setActiveTab,
  onTabChange,
}) => {
  const formattedDate = (dateToFormat: Date | string | null | undefined) =>
    dateToFormat
      ? new Date(dateToFormat).toLocaleDateString('en-AU', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '';
  const [applicationDetailsField] = useField<ApplicationDetailsDto>(name);
  const {
    referenceId,
    lastUpdated,
    assessedAs,
    status,
    statusDetail,
    title,
    submittedDate,
  } = getApplicationDetails(applicationDetailsField.value);

  // const navigate = useNavigate();
  // const messagesRoute = `/ta/${referenceId}/manage?tab=messages`;

  function routeToMessages() {
    // navigate(messagesRoute);
    // e.stopPropagation();
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'messages');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    window.scrollTo(0, 0);
    setActiveTab?.('messages'); // Not really needed, included for consistency with other tab changes
    onTabChange?.('messages');
    trackGAEvent('Application item/view messages');
  }

  return (
    <Col>
      <h3 id='applStatus' className='mb-3'>
        Application status
      </h3>
      <CustomAccordion id='applicationStatus' containerClassName='mb-3'>
        <CustomAccordionBody
          name={title ?? ''}
          eventKey='0'
          className='mb-4 py-2'
          nameRHS={
            <StatusPill
              status={status ?? ''}
              className='d-none d-sm-inline-block'
            />
          }
        >
          {/* Application Status content body */}
          <Row>
            <Col md={12}>
              <p className='fw-bold small pb-0 mb-0'>Reference ID</p>
              <p className='small'>{referenceId}</p>
            </Col>
            <Col md={12}>
              <p className='fw-bold small pb-0 mb-0'>Last Updated</p>
              <p className='small'>{formattedDate(lastUpdated)}</p>
            </Col>
            <Col md={12}>
              <p className='fw-bold small pb-0 mb-0'>Application submitted</p>
              <p className='small'>{formattedDate(submittedDate)}</p>
            </Col>
            <Col md={12}>
              <p className='fw-bold small pb-0 mb-0'>Assessed by NMI as</p>
              <p className='small'>{assessedAs}</p>
            </Col>
            <Col md={12}>
              <p className='fw-bold small pb-0 mb-0'>Status detail</p>
              <p className='small'>
                <StatusPill
                  status={status ?? ''}
                  className='d-inline-block d-sm-none me-2 me-sm-0'
                />
                {statusDetail}
              </p>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Button
                onClick={routeToMessages}
                type='button'
                className='btn btn-secondary'
                // title={`${messageCount} unread messages`}
                title='Jump to the messages tab'
              >
                <span>
                  <span>{'Messages '}</span>
                  {/* TO DO - Port over messsage count from PA dashboard to here. * /}
                                      {messageCount > 0 && (
                                        <>
                                            <span className='-me-md-2'>
                                                <span
                                                    className='badge badge-sm rounded-pill d-inline fade show bg-dark-red text-white'
                                                    style={{ fontFamily: 'monospace', top: '-10px' }}
                                                    role='status'
                                                >
                                                    {messageCount}
                                                </span>
                                            </span>
                                            <span className='visually-hidden'>
                                                {' unread'}
                                            </span>
                                        </>
                                    )} */}
                </span>
              </Button>
              {/* Future feature * /
                            <Button variant='link'>Withdraw application</Button> */}
            </Col>
          </Row>
        </CustomAccordionBody>
      </CustomAccordion>
    </Col>
  );
};

export default ApplicationDetailsStatus;
