import { Col, Container, Row } from 'react-bootstrap';
import type { PaSearchFilterProps } from '../types.ts';
import PaFilterMenu from './paFilterMenu.tsx';

const PaSearchFilter = (props: PaSearchFilterProps) => {
  const {
    containerClassName = '', // default props
    className = '', // default props
    initialFilters,
    setInitialFilters,
    setCurrentPage,
  } = props;

  return (
    <Container className={containerClassName}>
      <Row className={className}>
        <Col className='d-flex justify-content-end'>
          <PaFilterMenu
            setCurrentPage={setCurrentPage}
            initialFilters={initialFilters}
            setInitialFilters={setInitialFilters}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default PaSearchFilter;
