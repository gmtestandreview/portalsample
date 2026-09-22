import type { DiscardProps } from "../../components/forms/FormikForm/types.ts";

export const discardChanges: DiscardProps = {
	discardButtonTitle: "Discard changes",
	showCancelButton: false,
	locationOnDiscard: "/",
};

export const defaultFilter = {
	filterYearType: "allYears",
	filterStatusType: "allStatuses",
	filtersChanged: false,
	filterSortOrder: "descending",
	filterCurrentPage: 1,
	filterActiveTab: "drafts",
	filterSearchText: "",
};

export default discardChanges;
