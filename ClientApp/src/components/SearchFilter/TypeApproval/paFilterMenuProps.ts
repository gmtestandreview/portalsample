import type { Dispatch, SetStateAction } from 'react';
import type { PatternApprovalDashboardDto } from '../../../api/web-api-client';

export interface PaFilterMenuProps {
    containerClassName?: string;
    initialFilters: PatternApprovalDashboardDto | undefined;
    setInitialFilters: Dispatch<SetStateAction<PatternApprovalDashboardDto | undefined>>;
    setCurrentPage: Dispatch<SetStateAction<number>>;
}
