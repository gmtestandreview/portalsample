import { Col, Container, Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router';
import type { AccountDetails } from '../../../authentication/accountContext.tsx';
import { useAccountState } from '../../../authentication/hooks.tsx';
import FormBanner from '../../../components/forms/FormBanner/index.tsx';
import HeaderIntroText from '../../../components/HeaderIntroText/index.tsx';
import useBodyClass from '../../../components/Utilities/useBodyClass.tsx';
import useHtmlTitle from '../../../components/Utilities/useHtmlTitle.tsx';
import { formatBannerTitle } from '../../common/helperFunctions.ts';

const RequestForQuoteCreated = () => {
  const account = useAccountState();
  const { id } = useParams();

  useHtmlTitle('Request for quote created successfully | NMI Services portal');
  useBodyClass('account-created');

  const accountDetails: AccountDetails = account!.details!;
  return (
    <>
      <FormBanner
        title='Testing and calibration service - Request for quote'
        showSaveAndExitButton={false}
        refTitle={`Ref ID: ${id}`}
        subTitle={formatBannerTitle(accountDetails)}
        showGoToDashboardButton={true}
      />
      <Container
        fluid={true}
        id='main'
        role='main'
        className='px-0'
        tabIndex={-1}
      >
        <Container className='py-5'>
          <Row className='mb-5'>
            <Col sm={12} md={10} lg={8} className='mx-auto'>
              <h1 id='page-title' tabIndex={-1}>
                Your request has been submitted
              </h1>
              <HeaderIntroText>
                We have received your request for Testing and Calibration
                services and will review it shortly. If we need additional
                information, we will reach out to the contact person listed in
                your request.
              </HeaderIntroText>
              <p>
                When a quotation offer to perform Testing and Calibration
                services is available, we will notify the contact person
                provided and the quotation can be progressed through this
                portal.
              </p>
              <p>
                {
                  'Your feedback about using the portal is important to us. Please take the time to complete this '
                }
                <Link
                  to='https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu'
                  rel='external noopener noreferrer'
                  target='_blank'
                >
                  short survey
                </Link>
                {' about your experience.'}
              </p>
              <div className='d-grid d-md-block'>
                <Link
                  data-testid='go-to-dashboard-button'
                  to='/dashboard'
                  className='btn btn-primary'
                >
                  Go to dashboard
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </Container>
    </>
  );
};

export default RequestForQuoteCreated;
