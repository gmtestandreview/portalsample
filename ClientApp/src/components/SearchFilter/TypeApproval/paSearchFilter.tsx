import { Container, Row, Col } from 'react-bootstrap';
import type { PaSearchFilterProps } from '../types';
import PaFilterMenu from './paFilterMenu';

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
