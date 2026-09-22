"use client";
import {
	type BreadcrumbProps,
	type BreadcrumbsProps,
	Link,
	type LinkProps,
	Breadcrumb as RacBreadcrumb,
	Breadcrumbs as RacBreadcrumbs,
} from "react-aria-components/Breadcrumbs";
import { ChevronRight } from "../../AriaComponents/NmiIcon.tsx";
import "./Breadcrumbs.css";

export function Breadcrumbs<T>(props: BreadcrumbsProps<T>) {
	return <RacBreadcrumbs {...props} />;
}

export function Breadcrumb(
	props: BreadcrumbProps & Omit<LinkProps, "className">,
) {
	return (
		<RacBreadcrumb {...props}>
			{({ isCurrent }) => (
				<>
					<Link {...props} />
					{!isCurrent && <ChevronRight size={14} />}
				</>
			)}
		</RacBreadcrumb>
	);
}
