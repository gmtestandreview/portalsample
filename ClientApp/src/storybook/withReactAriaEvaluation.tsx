import type { Decorator } from "@storybook/react-vite";
import { type ReactNode, useLayoutEffect } from "react";

const evaluationClassName = "react-aria-evaluation";
let mountedEvaluationStories = 0;

type ReactAriaEvaluationFrameProps = Readonly<{
	children: ReactNode;
}>;

function ReactAriaEvaluationFrame({ children }: ReactAriaEvaluationFrameProps) {
	useLayoutEffect(() => {
		mountedEvaluationStories += 1;
		globalThis.document.body.classList.add(evaluationClassName);

		return () => {
			mountedEvaluationStories -= 1;
			if (mountedEvaluationStories === 0) {
				globalThis.document.body.classList.remove(evaluationClassName);
			}
		};
	}, []);

	return <div className={evaluationClassName}>{children}</div>;
}

export const withReactAriaEvaluation: Decorator = (Story) => (
	<ReactAriaEvaluationFrame>
		<Story />
	</ReactAriaEvaluationFrame>
);
