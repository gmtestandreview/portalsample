import type { Dispatch, SetStateAction } from 'react';
import type {
  StatusEnumDto,
  PatternApprovalDashboardDto,
} from '../../api/web-api-client';

export interface Filters {
  year?: number;
  status?: StatusEnumDto;
  sortOrder?: string;
}

export interface InitialFilters {
  filterYearType: string;
  filterStatusType: string;
  filtersChanged: boolean;
}
export interface UserProfile {
  filterYearType?: string | undefined;
  filterStatusType?: string | undefined;
  filterSortOrder?: string | undefined;
  filtersChanged?: boolean | undefined;
  filterCurrentPage?: number | undefined;
  filterActiveTab?: DashboardTab | undefined;
  filterSearchText?: string | undefined;
}

export interface SearchFilterProps {
  containerClassName?: string;
  className?: string;
  initialFilters: UserProfile | undefined;
  setInitialFilters: Dispatch<SetStateAction<UserProfile | undefined>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  placeholder?: string;
}

export interface PaSearchFilterProps {
  containerClassName?: string;
  className?: string;
  initialFilters: PatternApprovalDashboardDto;
  setInitialFilters: Dispatch<
    SetStateAction<PatternApprovalDashboardDto | undefined>
  >;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}

export enum DashboardTab {
  Drafts = 'drafts',
  Requests = 'requests',
  Instruments = 'instruments',
}
