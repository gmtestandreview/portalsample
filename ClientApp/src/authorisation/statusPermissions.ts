import {
  viewReportLinkStatus,
  viewReportRecalibrationLinkStatus,
} from '../routes/common/statusPermissions';

export const showReportLink = (status: string | undefined) => {
  return status
    ? viewReportLinkStatus.some((s) => s === status) === false
    : false;
};

export const showReportRecalibrationLink = (status: string | undefined) => {
  return status
    ? viewReportRecalibrationLinkStatus.some((s) => s === status) === false
    : false;
};
