import Pagination from 'react-bootstrap/Pagination';
import type { CustomPaginationProps } from './types';
import useVisiblePageRange from './useVisiblePageRange';

const CustomPagination = (props: CustomPaginationProps) => {
    const {
        containerClassName = '', // default props
        className = '', // default props
        currentPage,
        totalPages,
        onPageChange,
        visiblePageRange: initialVisiblePageRange = 10, // default to 10 if not provided
    } = props;

    // Use the custom hook for responsive visiblePageRange
    const visiblePageRange = useVisiblePageRange(initialVisiblePageRange);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const renderPaginationItems = () => {
        const items = [];
        const halfRange = Math.floor(visiblePageRange / 2);
        let startPage = Math.max(1, currentPage - halfRange);
        let endPage = Math.min(totalPages, currentPage + halfRange);

        // Adjust the range if near the start or end
        if (currentPage <= halfRange) {
            endPage = Math.min(totalPages, visiblePageRange);
        } else if (currentPage + halfRange > totalPages) {
            startPage = Math.max(1, totalPages - visiblePageRange + 1);
        }

        for (let page = startPage; page <= endPage; page += 1) {
            items.push(
                <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => handlePageChange(page)}
                    aria-label={`Page ${page}`}
                >
                    {page}
                </Pagination.Item>
            );
        }
        return { items, startPage, endPage };
    };

    return (
        <nav className='pagination-nav' aria-labelledby='pagination' hidden={totalPages <= 1}>
            <h2 id='pagination' className='visually-hidden'>Results page navigation</h2>
            <div className={containerClassName}>
                <Pagination className={className}>
                    <Pagination.First
                        linkClassName={`firstpage ${renderPaginationItems().startPage > 1 ? '' : 'd-none'}`}
                        onClick={() => handlePageChange(1)}
                        title='Go to first page'
                    >
                        <i className='icon icon-doublechevron-left fs-7' />
                    </Pagination.First>
                    <Pagination.Prev
                        linkClassName={`prev ${currentPage === 1 ? 'd-none' : ''}`}
                        onClick={() => handlePageChange(currentPage - 1)}
                        title='Go back a page'
                    >
                        <i className='icon icon-chevron-left fs-7' />
                    </Pagination.Prev>
                    {renderPaginationItems().items}
                    <Pagination.Next
                        linkClassName={`next ${currentPage === totalPages ? 'd-none' : ''}`}
                        onClick={() => handlePageChange(currentPage + 1)}
                        title='Go forward a page'
                    >
                        <i className='icon icon-chevron-right fs-7' />
                    </Pagination.Next>

                    <Pagination.Last
                        linkClassName={`lastpage ${renderPaginationItems().endPage < totalPages ? '' : 'd-none'}`}
                        onClick={() => handlePageChange(totalPages)}
                        title='Go to last page'
                    >
                        <i className='icon icon-doublechevron-right fs-7' />
                    </Pagination.Last>
                </Pagination>
            </div>
            <p className='small text-center'>
                <span>
                    {'Page '}
                    {currentPage}
                    {' of '}
                    {totalPages}
                </span>
            </p>
        </nav>
    );
};

export default CustomPagination;
