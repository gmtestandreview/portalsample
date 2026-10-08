import type { DiscardProps } from '../types';

export interface FormBannerProps {
  title?: string;
  refTitle?: string | null;
  subTitle?: string | null;
  showSaveAndExitButton?: boolean;
  showGoToDashboardButton?: boolean;
  discard?: DiscardProps;
}
