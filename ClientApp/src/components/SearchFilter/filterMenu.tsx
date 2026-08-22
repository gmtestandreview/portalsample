import type React from 'react';
import { useRef, useState } from 'react';
import {
    Row, Col,
    Button,
    Form,
    Dropdown,
    Container,
} from 'react-bootstrap';
import { Formik } from 'formik';
import RadioButtonGroup from '../Inputs/RadioButtonGroup';
import type { FilterMenuProps } from './filterMenuProps';
import { StatusEnumDto } from '../../api/web-api-client';
import type { RadioButtonProps } from '../Inputs/RadioButton/types';
import { DashboardTab } from './types';
import { useAccountDispatch } from '../../authentication/hooks';
import { defaultFilter } from '../../routes/common/constants';
import { trackGAEvent } from '../../analytics/GoogleAnalytics';

function getNameForUse(arg0: string): string {
    return arg0;
}

const FilterMenu = (props: FilterMenuProps) => {
    const {
        containerClassName = '', // default props
        className: _className = '', // default props
        initialFilters,
        setInitialFilters,
        setCurrentPage,
    } = props;
    const accountContext = useAccountDispatch();

    const filterStatus: RadioButtonProps<string>[] = [{
        label: 'Show all statuses',
        value: 'allStatuses',
        id: 'filterStatusType-All',
    }, {
        label: 'Quote request submitted',
        value: StatusEnumDto.Submitted,
        id: 'filterStatusType-submitted',
    }, {
        label: 'Awaiting customer action',
        value: StatusEnumDto.AwaitingClientInformation,
        id: 'filterStatusType-awaiting',
    }, {
        label: 'Quote offer is available',
        value: StatusEnumDto.QuoteAvailable,
        id: 'filterStatusType-offer',
    }, {
        label: 'Report is available',
        value: StatusEnumDto.ReportIssued,
        id: 'filterStatusType-report-available',
    }];

    const filterYear: RadioButtonProps<string>[] = [{
        label: 'Show all years',
        value: 'allYears',
        id: 'filterYearType-All',
    }, {
        label: 'Current year - 2025',
        value: '2025',
        id: 'filterYearType-2025',
    }, {
        label: 'Previous year - 2024',
        value: '2024',
        id: 'filterYearType-2024',
    }];

    const [show, setShow] = useState(false);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    function handleClose(_event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
        setShow(false);
    }

    function handleResetFilters(_event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
        setCurrentPage(1);
        const profile = {
            filterYearType: defaultFilter.filterYearType,
            filterStatusType: defaultFilter.filterStatusType,
            filtersChanged: defaultFilter.filtersChanged,
            filterCurrentPage: 1,
            filterActiveTab: initialFilters?.filterActiveTab,
            filterSearchText: initialFilters?.filterSearchText,
        };
        setInitialFilters(profile);
        accountContext?.setUserProfile({ testingCalibrationDashboard: profile });
        setShow(false);
    }

    // Show filter number bubble if non-default filters have been applied
    function countChangedFilters(filters: Partial<typeof defaultFilter>): number {
        let changedCount = 0;
        if (filters.filterYearType && filters.filterYearType !== defaultFilter.filterYearType) {
            changedCount += 1;
        }
        if (filters.filterStatusType && filters.filterStatusType !== defaultFilter.filterStatusType) {
            changedCount += 1;
        }
        if (filters.filterSortOrder && filters.filterSortOrder !== defaultFilter.filterSortOrder) {
            changedCount += 1;
        }
        // Add more comparisons if there are additional filters
        return changedCount;
    }

    return (
        <Dropdown
            align='end'
            id='search-filter-dropdown'
            data-testid='search-filter-dropdown'
            className={containerClassName}
            show={show}
            onToggle={(isOpen) => {
                trackGAEvent('search-filter-dropdown');
                setShow(isOpen);
                if (!isOpen) closeBtnRef.current?.click();
            }}
        >
            <Dropdown.Toggle
                id='filter-dropdown'
                aria-haspopup='true'
                aria-expanded={show}
                className='btn btn-secondary'
                title={initialFilters?.filtersChanged ? `${countChangedFilters(initialFilters)} filters have been applied` : 'No filters applied'}
            >
                <i className='icon-article ms-md-1 me-md-2' aria-hidden='true' />
                <span>
                    <span className='d-none d-md-inline-block'>
                        {'Filters '}
                    </span>
                    <span className='me-md-2'>
                        <output
                            className={`badge badge-sm rounded-pill d-inline fade show ${
                                initialFilters?.filtersChanged
                                    ? 'bg-dark-red text-white'
                                    : 'bg-transparent text-dark'
                            }`}
                            style={{ fontFamily: 'monospace', top: '-10px' }}
                        >
                            { initialFilters?.filtersChanged
                                ? `${countChangedFilters(initialFilters)}`
                                : (
                                    <>
                                        {/* preserve space */}
                                        <span aria-hidden='true'>&nbsp;</span>
                                        {/* <span className='visually-hidden text-invert'>none</span> */}
                                    </>
                                )}
                        </output>
                    </span>
                    <span className='visually-hidden'>
                        {' applied'}
                    </span>
                </span>
            </Dropdown.Toggle>
            <Dropdown.Menu flip={false} className={`filter-menu ${containerClassName} shadow`} aria-label='Filter Menu'>
                <Formik
                    enableReinitialize
                    initialValues={initialFilters ?? defaultFilter}
                    onSubmit={async (values, { setSubmitting, setValues }) => {
                        const { filterYearType, filterStatusType, filterSortOrder } = values;
                        const filtersChanged = filterStatusType !== defaultFilter.filterStatusType || filterYearType !== defaultFilter.filterYearType;
                        // reset page to 1 this is common practice when changing filters
                        setCurrentPage(1);
                        // setInitialfilters will trigger useEffect and an API call
                        const filters = {
                            filterYearType,
                            filterStatusType,
                            filtersChanged,
                            filterSortOrder,
                            filterCurrentPage: 1,
                            filterActiveTab: initialFilters?.filterActiveTab,
                            filterSearchText: initialFilters?.filterSearchText,
                        };
                        setInitialFilters(filters);
                        // setValues will set the initialValues to the current search values
                        setValues({
                            filterYearType, filterStatusType, filtersChanged, filterSortOrder,
                        });
                        // save user profile
                        accountContext?.setUserProfile({ testingCalibrationDashboard: filters });
                        setSubmitting(false);
                    }}
                    validateOnChange={false}
                    validateOnBlur={false}
                >
                    {({
                        submitForm, handleChange, resetForm, setValues: _setValues,
                    }) => (
                        <Form>
                            <Container>
                                <Row className='mb-3 g-0'>
                                    <Col xs={10} md={11}>
                                        <Row>
                                            <h3 className='visually-hidden'>Select your dashboard filter options</h3>
                                            <Col xs={12} sm={6} className='pt-2'>
                                                <RadioButtonGroup
                                                    legend='Status'
                                                    name={getNameForUse('filterStatusType')}
                                                    isSummary={false}
                                                    id='q-filterStatusType'
                                                    options={filterStatus}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                        trackGAEvent('FilterStatusType');
                                                        handleChange(e);
                                                    }}
                                                    disabled={initialFilters?.filterActiveTab === DashboardTab.Drafts
                                                        || initialFilters?.filterActiveTab === DashboardTab.Instruments}
                                                />
                                            </Col>
                                            <Col xs={12} sm={6} className='pt-2'>
                                                <RadioButtonGroup
                                                    legend='Year'
                                                    name={getNameForUse('filterYearType')}
                                                    id='q-filterYearType'
                                                    isSummary={false}
                                                    className='my-2'
                                                    options={filterYear}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                        trackGAEvent('Filteryeartype');
                                                        handleChange(e);
                                                    }}
                                                />
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col xs={2} md={1} className='text-end'>
                                        <Button
                                            ref={closeBtnRef}
                                            data-testid='close-filter-button'
                                            onClick={(e) => {
                                                trackGAEvent('CloseFilter');
                                                handleClose(e);
                                                resetForm({ values: initialFilters });
                                            }}
                                            variant='tertiary'
                                            className='ms-md-auto'
                                        >
                                            <i className='icon-close me-1' aria-hidden='true' />
                                            <span className='visually-hidden'>Close filter menu</span>
                                        </Button>
                                    </Col>
                                </Row>
                                <Row className='mb-3'>
                                    <Col>
                                        <div className='d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
                                            <Button
                                                data-testid='cancel-filter-button'
                                                onClick={(e) => {
                                                    trackGAEvent('CancelFilter');
                                                    handleClose(e);
                                                    resetForm({ values: initialFilters });
                                                }}
                                                variant='tertiary'
                                                className='me-md-auto -mb-4 order-2 order-md-0'
                                            >
                                                <i className='icon-close me-1' aria-hidden='true' />
                                                {' Cancel'}
                                            </Button>
                                            <div className='d-grid gap-4 d-md-flex'>
                                                <Button
                                                    data-testid='reset-filter-button'
                                                    onClick={(e) => {
                                                        trackGAEvent('ResetFilter');
                                                        handleResetFilters(e);
                                                        resetForm({ values: defaultFilter });
                                                    }}
                                                    variant='secondary'
                                                    className='me-md-auto order-2 order-md-0'
                                                >
                                                    Reset
                                                </Button>
                                                <Button
                                                    data-testid='apply-filter-button'
                                                    onClick={(e) => {
                                                        trackGAEvent('ApplyFilter');
                                                        submitForm();
                                                        handleClose(e);
                                                    }}
                                                    variant='primary'
                                                    className='ms-md-auto'
                                                >
                                                    Show results
                                                </Button>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </Container>
                        </Form>
                    )}
                </Formik>
            </Dropdown.Menu>
        </Dropdown>

    );
};

export default FilterMenu;
