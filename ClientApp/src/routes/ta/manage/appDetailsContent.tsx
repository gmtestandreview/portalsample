import type { Dispatch, FC, SetStateAction } from 'react';
import { Row, Col } from 'react-bootstrap';
import BlockUISpinner from '../../../components/BlockUISpinner';
import {
  CustomAccordion,
  CustomAccordionBody,
} from '../../../components/Accordion';
import ApplicationAndInstrument from '../applicationAndInstrument';
import OrganisationAndContact from '../organisationAndContact';
import SupportingDocuments from '../supportingDocuments';
import ApplicationDetailsStatus from './applicationDetailsStatus';

interface AppDetailsContentProps {
  isModalOpen?: boolean;
  isDataLoading?: boolean;
  setActiveTab: Dispatch<SetStateAction<string>>;
  onTabChange: (key: string | null) => void;
}

const AppDetailsContent: FC<AppDetailsContentProps> = ({
  isModalOpen,
  isDataLoading,
  setActiveTab,
  onTabChange,
}) => {
  return (
    <Row className='mb-4'>
      <Col
        {...{ inert: isModalOpen ? '' : undefined }}
        aria-busy={!isModalOpen && isDataLoading}
        aria-live={isModalOpen ? undefined : 'polite'}
      >
        {!isModalOpen && isDataLoading ? (
          <BlockUISpinner partial>
            <p>Loading data...</p>
          </BlockUISpinner>
        ) : (
          <div className='appl-items mb-5'>
            <h2 className='visually-hidden'>Details</h2>
            <Row className='mb-5'>
              <ApplicationDetailsStatus
                name='applicationDetails'
                setActiveTab={setActiveTab}
                onTabChange={onTabChange}
              />
            </Row>
            <Row className='mb-5'>
              <Col>
                <h3 id='recordOfSubmittedAppl' className='mb-3'>
                  Record of application submitted
                </h3>
                <CustomAccordion
                  id='organisationAndContact'
                  containerClassName='mb-3'
                >
                  <CustomAccordionBody
                    name='Organisation details'
                    eventKey='1'
                    className='mb-4 py-2'
                  >
                    <OrganisationAndContact
                      isSummary
                      name='organisationAndContact'
                    />
                  </CustomAccordionBody>
                </CustomAccordion>
                <CustomAccordion
                  id='applicationAndInstrument'
                  containerClassName='mb-3'
                >
                  <CustomAccordionBody
                    name='Application details'
                    eventKey='2'
                    className='mb-4 py-2'
                  >
                    <ApplicationAndInstrument
                      isSummary
                      name='applicationAndInstrument'
                    />
                  </CustomAccordionBody>
                </CustomAccordion>
                <CustomAccordion
                  id='supportingDocuments'
                  containerClassName='mb-3'
                >
                  <CustomAccordionBody
                    name='Supporting documents'
                    eventKey='3'
                    className='mb-4 py-2'
                    nameRHS={
                      <button
                        type='button'
                        className='btn btn-link text-nowrap'
                        title='Jump to the documents tab'
                        onClick={(e) => {
                          e.stopPropagation();
                          const params = new URLSearchParams(
                            window.location.search,
                          );
                          params.set('tab', 'documents');
                          const newUrl = `${window.location.pathname}?${params.toString()}`;
                          window.history.pushState({}, '', newUrl);
                          window.scrollTo(0, 0);
                          setActiveTab('documents');
                        }}
                      >
                        View{' '}
                        <span className='d-none d-sm-inline'>documents</span>
                      </button>
                    }
                  >
                    <SupportingDocuments
                      isSummary
                      suppressDocChanges
                      name='supportingDocuments.form.documents'
                      attachment={{
                        onUploadFiles: () => Promise.resolve([]), // Not used
                      }}
                    />
                  </CustomAccordionBody>
                </CustomAccordion>
              </Col>
            </Row>
          </div>
        )}
      </Col>
    </Row>
  );
};
export default AppDetailsContent;
