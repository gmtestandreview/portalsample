"use client";
import {
	type BreadcrumbProps,
	type BreadcrumbsProps,
	Link,
	type LinkProps,
	Breadcrumb as RACBreadcrumb,
	Breadcrumbs as RACBreadcrumbs,
} from "react-aria-components/Breadcrumbs";
import { ChevronRight } from "../../AriaComponents/NmiIcon";
import "./Breadcrumbs.css";

export function Breadcrumbs<T>(props: BreadcrumbsProps<T>) {
	return <RACBreadcrumbs {...props} />;
}

export function Breadcrumb(
	props: BreadcrumbProps & Omit<LinkProps, "className">,
) {
	return (
		<RACBreadcrumb {...props}>
			{({ isCurrent }) => (
				<>
					<Link {...props} />
					{!isCurrent && <ChevronRight size={14} />}
				</>
			)}
		</RACBreadcrumb>
	);
}
