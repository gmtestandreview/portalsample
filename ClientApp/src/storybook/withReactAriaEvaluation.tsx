import {useLayoutEffect, type ReactNode} from 'react';
import type {Decorator} from '@storybook/react-vite';

const evaluationClassName = 'react-aria-evaluation';
let mountedEvaluationStories = 0;

function ReactAriaEvaluationFrame({children}: {children: ReactNode}) {
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
