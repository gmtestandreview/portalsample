import { Col, Row, Container } from 'react-bootstrap';
import {
  getDashboardNotification,
  clearDashboardNotification,
  getDashboardInfoNotification,
  clearDashboardInfoNotification,
} from '../../storage/notification';
import NotificationMessage from '../../components/Alert/NotificationMessage';

// TS Move this to a constants file if we need this setting app wide
export const DEFAULT_DASHBOARD_PAGESIZE = 10;

export const showDashboardMessage = (message: React.JSX.Element | null) => (
  <>
    {message && (
      <Container>
        <Row>
          <Col>{message}</Col>
        </Row>
      </Container>
    )}
  </>
);

export const setNotification = () => {
  const dashboardNotification = getDashboardNotification();
  return dashboardNotification ? (
    <NotificationMessage
      id='notif-message-1'
      canClose
      onClose={clearDashboardNotification}
      {...dashboardNotification}
    />
  ) : null;
};

export const setInfoNotification = () => {
  const dashboardInfoNotification = getDashboardInfoNotification();
  return dashboardInfoNotification ? (
    <NotificationMessage
      id='notif-info-message-2'
      canClose
      onClose={clearDashboardInfoNotification}
      {...dashboardInfoNotification}
    />
  ) : null;
};

export const handlePaginationScroll = () => {
  const titleElement = document.getElementById('dash-type-title');
  titleElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
