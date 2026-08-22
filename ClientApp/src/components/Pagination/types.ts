export interface CustomPaginationProps {
    containerClassName?: string;
    className?: string;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    visiblePageRange?: number;
}
