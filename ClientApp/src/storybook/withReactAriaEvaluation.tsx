import type { Decorator } from '@storybook/react-vite';
import ReactAriaEvaluationFrame from './ReactAriaEvaluationFrame';

export const withReactAriaEvaluation: Decorator = (Story) => (
  <ReactAriaEvaluationFrame>
    <Story />
  </ReactAriaEvaluationFrame>
);
