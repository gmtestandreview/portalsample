import { useCallback, useEffect } from "react";
import { useLocation } from "react-router";

const RouteChangeScrollTop = () => {
	const { pathname } = useLocation();

	const resetFocusAndScroll = useCallback((_currentPath: string) => {
		window.scrollTo(0, 0);
		setTimeout(() => {
			if (document.querySelector("#page-title")) {
				const el: HTMLElement = document.querySelector(
					"#page-title",
				) as HTMLElement;
				setTimeout(() => {
					el?.focus();
				}, 500);
			} else {
				const el: HTMLElement = document.querySelector(
					"#page-top",
				) as HTMLElement;
				el?.focus();
			}
		}, 100);
	}, []);

	useEffect(() => {
		resetFocusAndScroll(pathname);
	}, [pathname, resetFocusAndScroll]);

	return null;
};

export default RouteChangeScrollTop;
