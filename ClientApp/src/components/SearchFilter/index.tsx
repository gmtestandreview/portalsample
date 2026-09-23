import { Col, Container, Row } from 'react-bootstrap';
import { useAccountDispatch } from '../../authentication/hooks.tsx';
import FilterMenu from './filterMenu.tsx';
import SearchBox from './searchBox.tsx';
import type { SearchFilterProps } from './types.ts';

const SearchFilter = (props: SearchFilterProps) => {
  const {
    containerClassName = '', // default props
    className = '', // default props
    initialFilters,
    setInitialFilters,
    setCurrentPage,
    placeholder = '',
  } = props;
  const accountContext = useAccountDispatch();

  const handleSearchSubmit = (searchValue: string | undefined) => {
    setCurrentPage(1); // Reset to the first page on search
    setInitialFilters((prevFilters) => ({
      ...prevFilters,
      filterSearchText: searchValue,
      filterCurrentPage: 1,
    }));

    const profile = {
      filterYearType: initialFilters?.filterYearType,
      filterStatusType: initialFilters?.filterStatusType,
      filtersChanged: initialFilters?.filtersChanged,
      filterCurrentPage: 1,
      filterActiveTab: initialFilters?.filterActiveTab,
      filterSearchText: searchValue,
    };
    accountContext?.setUserProfile({ testingCalibrationDashboard: profile });
  };

  return (
    <Container className={containerClassName}>
      <Row className={className}>
        <Col className='d-flex justify-content-between align-items-center'>
          <SearchBox
            containerClassName='d-block me-3 mb-0 col col-lg-7'
            onSearchSubmit={handleSearchSubmit}
            initialSearchValue={initialFilters?.filterSearchText}
            placeholder={placeholder}
          />
          <span className='text-end'>
            <FilterMenu
              setCurrentPage={setCurrentPage}
              initialFilters={initialFilters}
              setInitialFilters={setInitialFilters}
            />
          </span>
        </Col>
      </Row>
    </Container>
  );
};

export default SearchFilter;
