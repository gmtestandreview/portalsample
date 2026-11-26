import {
  viewReportLinkStatus,
  viewReportRecalibrationLinkStatus,
} from '../routes/common/statusPermissions';

export const showReportLink = (status: string | undefined) => {
  return status ? !viewReportLinkStatus.includes((s) => s === status) : false;
};

export const showReportRecalibrationLink = (status: string | undefined) => {
  return status
    ? !viewReportRecalibrationLinkStatus.includes((s) => s === status)
    : false;
};
