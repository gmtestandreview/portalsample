'use client';
import {
  Button as RacButton,
  type ButtonProps as RacButtonProps,
} from 'react-aria-components/Button';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { ProgressCircle } from '../../react-aria-evaluation/primitives/ProgressCircle.tsx';
import './Button.css';

interface ButtonProps extends RacButtonProps {
  /**
   * The visual style of the button (Vanilla CSS implementation specific).
   *
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'quiet';
}

export function Button(props: Readonly<ButtonProps>) {
  return (
    <RacButton
      {...props}
      className='react-aria-Button button-base'
      data-variant={props.variant || 'primary'}
    >
      {composeRenderProps(props.children, (children, { isPending }) => (
        <>
          {!isPending && children}
          {isPending && (
            <ProgressCircle aria-label='Saving...' isIndeterminate={true} />
          )}
        </>
      ))}
    </RacButton>
  );
}
