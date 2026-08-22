interface CustomPaginationHeaderProps {
    totalCount: number;
    pageSize: number;
    currentPage: number;
}

const CustomPaginationHeader = ({ totalCount, pageSize, currentPage }: CustomPaginationHeaderProps) => {
    const firstVisibleResult = ((currentPage - 1) * pageSize) + 1;
    const lastVisibleResult = Math.min(currentPage * pageSize, totalCount);

    return (
        <span hidden={totalCount <= 0}>
            {'Displaying '}
            <strong>
                {firstVisibleResult}
                {' - '}
                {lastVisibleResult}
            </strong>
            {' of '}
            <strong>{totalCount}</strong>
            <span className='visually-hidden'>{' Results'}</span>
        </span>
    );
};

export default CustomPaginationHeader;
