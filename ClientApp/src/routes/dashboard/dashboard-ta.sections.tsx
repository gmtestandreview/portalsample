import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Link } from 'react-router';
import { Col, Row, Tab, Nav } from 'react-bootstrap';
import { PatternFormat } from 'react-number-format';
import BlockUISpinner from '../../components/BlockUISpinner';
import StandardPathway from '../../components/tiles/StandardPathway';
import NoRequests from '../../components/RequestList/noRequests';
import PaRequestItem from '../../components/RequestList/paRequestItem';
import { DashboardTab } from '../../components/SearchFilter/types';
import CustomPagination from '../../components/Pagination';
import CustomPaginationHeader from '../../components/PaginationHeader';
import { trackGAEvent } from '../../analytics/GoogleAnalytics';
import PaSearchFilter from '../../components/SearchFilter/TypeApproval/paSearchFilter';
import type useAccountContext from '../../authentication/hooks';
import type {
  PatternApprovalDashboardDetailsDto,
  PatternApprovalDashboardDto,
  ServicesOffered,
} from '../../api/web-api-client';
import { selectDashboardTab, toDashboardTab } from '../common/helperFunctions';
import { DEFAULT_DASHBOARD_PAGESIZE } from './dashboardShared';

type AccountDetails = NonNullable<
  NonNullable<ReturnType<typeof useAccountContext>>['details']
>;

interface DashboardTaTitleProps {
  services: ServicesOffered[];
  initialFilters: PatternApprovalDashboardDto | undefined;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  setInitialFilters: Dispatch<
    SetStateAction<PatternApprovalDashboardDto | undefined>
  >;
}

export const DashboardTaTitle = ({
  services,
  initialFilters,
  setCurrentPage,
  setInitialFilters,
}: DashboardTaTitleProps) => (
  <>
    <Row className='mb-2'>
      <Col className='d-flex justify-content-between align-items-md-center'>
        <h2 id='dash-type-title' className='mb-0 me-3' tabIndex={-1}>
          Manage Pattern/type approval
          {/* TO DO - Do we componentise this? */}
          {services.filter((x: ServicesOffered) => x.isActive).length > 1 && (
            <span className='text-start ms-3 me-3'>
              <Link
                to='/services-we-offer?mode=manage'
                className='fw-normal fs-6'
              >
                Change
              </Link>
            </span>
          )}
        </h2>

        <span className='text-end'>
          <Link
            data-testid='new-application-button'
            to='/ta/type-approval-create-pre'
            className='btn btn-primary text-nowrap'
            onClick={() => {
              trackGAEvent('New TA application');
            }}
          >
            <i className='icon-plus me-md-2' aria-hidden='true' />
            <span className='d-none d-md-inline-block'>New application</span>
          </Link>
        </span>
      </Col>
    </Row>
    <Row className='mb-2'>
      {initialFilters && (
        <PaSearchFilter
          setCurrentPage={setCurrentPage}
          initialFilters={initialFilters}
          setInitialFilters={setInitialFilters}
          className='mb-md-1'
        />
      )}
    </Row>
  </>
);

interface DashboardTaTabsProps {
  activeTab: DashboardTab;
  changeTab: (tab: DashboardTab) => void;
  isDataLoading: boolean;
  currentPage: number;
  totalCount: number;
  children: ReactNode;
}

export const DashboardTaTabs = ({
  activeTab,
  changeTab,
  isDataLoading,
  currentPage,
  totalCount,
  children,
}: DashboardTaTabsProps) => (
  <Row className='mb-3'>
    <Col>
      <Tab.Container
        id='dashboard-type'
        activeKey={activeTab}
        onSelect={(key) => {
          selectDashboardTab(key, changeTab);
        }}
      >
        <Nav
          as='ul'
          variant='underline'
          className='align-items-center overflow-x-auto no-scrollbars mb-md-3'
          aria-label='Select your dashboard view'
        >
          <span className='d-flex flex-nowrap'>
            <Nav.Item as='li' role='presentation'>
              <Nav.Link
                id={DashboardTab.Drafts}
                eventKey={DashboardTab.Drafts}
                className='px-3'
                onClick={() => {
                  changeTab(DashboardTab.Drafts);
                  trackGAEvent(DashboardTab.Drafts);
                }}
              >
                Drafts
              </Nav.Link>
            </Nav.Item>
            <Nav.Item as='li' role='presentation'>
              <Nav.Link
                id={DashboardTab.Requests}
                eventKey={DashboardTab.Requests}
                className='px-3'
                onClick={() => {
                  changeTab(DashboardTab.Requests);
                  trackGAEvent(DashboardTab.Requests);
                }}
              >
                Applications
              </Nav.Link>
            </Nav.Item>
            {/* <Nav.Item
                              as='li'
                              role='presentation'
                          >
                              <Nav.Link
                                  id={DashboardTab.Instruments}
                                  eventKey={DashboardTab.Instruments}
                                  className='px-3'
                                  onClick={() => {
                                      changeTab(DashboardTab.Instruments);
                                      trackGAEvent(DashboardTab.Instruments);
                                  }}
                              >
                                  Instrument/artefacts
                              </Nav.Link>
                          </Nav.Item> */}
          </span>
          {!isDataLoading && (
            <span className='d-flex justify-content-end ms-auto p-2 ps-4 small text-nowrap'>
              <CustomPaginationHeader
                currentPage={currentPage}
                totalCount={totalCount}
                pageSize={DEFAULT_DASHBOARD_PAGESIZE}
              />
            </span>
          )}
        </Nav>
        <Tab.Content>
          <Tab.Pane eventKey={DashboardTab.Drafts} tabIndex={0}>
            {children}
          </Tab.Pane>
          <Tab.Pane eventKey={DashboardTab.Requests} tabIndex={0}>
            {children}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Col>
  </Row>
);

interface RequestTabContentProps {
  requests: PatternApprovalDashboardDetailsDto[];
  isModalOpen: boolean;
  isDataLoading: boolean;
  userAcceptedTermsOfUse: boolean | undefined;
  currentPage: number;
  totalPages: number;
  activeTab: DashboardTab;
  initialFilters: PatternApprovalDashboardDto | undefined;
  setDeleteSuccess: Dispatch<SetStateAction<boolean>>;
  onPageChange: (page: number) => void;
}

export const RequestTabContent = ({
  requests,
  isModalOpen,
  isDataLoading,
  userAcceptedTermsOfUse,
  currentPage,
  totalPages,
  activeTab,
  initialFilters,
  setDeleteSuccess,
  onPageChange,
}: RequestTabContentProps) => (
  <Row className='mb-4'>
    <Col
      inert={isModalOpen}
      aria-busy={!isModalOpen && isDataLoading}
      aria-live={isModalOpen ? undefined : 'polite'}
    >
      {!isModalOpen && isDataLoading ? (
        <BlockUISpinner partial>
          <p>Loading data...</p>
        </BlockUISpinner>
      ) : (
        <>
          <div className='dashboard-items mb-5'>
            {requests.length > 0 && userAcceptedTermsOfUse ? ( // Check user has accepted terms of use before showing the request list
              <ol className='list-unstyled'>
                {requests.map((r: PatternApprovalDashboardDetailsDto) => (
                  <li key={r.referenceId}>
                    <PaRequestItem
                      setDeleteSuccess={setDeleteSuccess}
                      request={r}
                      tab={
                        toDashboardTab(initialFilters?.filterActiveTab) ??
                        activeTab
                      }
                    />
                  </li>
                ))}
              </ol>
            ) : (
              !isDataLoading && (
                <NoRequests
                  serviceName='application'
                  serviceNameLinkTitle='new application'
                  serviceNameLinkUrl='/ta/type-approval-create-pre'
                />
              )
            )}
          </div>
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            containerClassName='d-flex justify-content-center'
          />
        </>
      )}
    </Col>
  </Row>
);

export const DashboardTaOrgSummary = ({
  details,
}: {
  details: AccountDetails;
}) => (
  <>
    <h2 className='h1 text-body mb-1 lh-sm' aria-describedby='orgABN'>
      <span className='d-block mb-1 fs-5 fw-normal'>
        {'Currently managing '}
      </span>
      <span className='d-none d-block text-break'>
        {!!details.trading && details.trading}
        {!!details.trading && !!details.branch && ' - '}
        {!!details.branch && details.branch}
      </span>
      <span className='d-block text-break'>
        {!!details.organisation && details.organisation}
      </span>
    </h2>
    {!!details.abn && (
      <>
        <span id='orgABN' className='d-inline-block me-3 fw-normal'>
          {'ABN: '}
          <PatternFormat
            value={details.abn}
            displayType='text'
            format='## ### ### ###'
            aria-hidden='true'
            role='presentation'
            valueIsNumericString={false}
          />
        </span>
        <span className='visually-hidden'>
          {details.abn.split('').join(' ')}
        </span>
      </>
    )}
  </>
);

export const DashboardTaQuickLinks = () => (
  <Row className='mb-5'>
    <h2 className='pt-md-4 mb-3'>Quick links</h2>
    <Col md>
      <StandardPathway
        type='internal'
        title='Add an NMI Service'
        linkDescription=' '
        bodyText='The National Measurement Institute (NMI) offers a range of service. Find out more...'
        to='/services-we-offer?mode=manage'
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
        title='Your feedback'
        linkDescription=' '
        bodyText='Your feedback about using the portal is important to us. Please take the time to let us know your experience.'
        linkHref='https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu'
        target='_blank' // 'NMI-Feedback'
      />
    </Col>
  </Row>
);
