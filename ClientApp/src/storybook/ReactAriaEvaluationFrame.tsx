import { useLayoutEffect, type ReactNode } from 'react';

const evaluationClassName = 'react-aria-evaluation';
let mountedEvaluationStories = 0;

type ReactAriaEvaluationFrameProps = Readonly<{
  children: ReactNode;
}>;

function ReactAriaEvaluationFrame({
  children,
}: Readonly<ReactAriaEvaluationFrameProps>) {
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

export default ReactAriaEvaluationFrame;
