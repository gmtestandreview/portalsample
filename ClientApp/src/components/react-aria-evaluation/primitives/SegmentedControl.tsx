'use client';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import {
  ToggleButtonGroup as RacToggleButtonGroup,
  SelectionIndicator,
  ToggleButton,
  type ToggleButtonGroupProps,
  type ToggleButtonProps,
} from 'react-aria-components/ToggleButtonGroup';
import './SegmentedControl.css';

export function SegmentedControl(props: ToggleButtonGroupProps) {
  return (
    <RacToggleButtonGroup
      {...props}
      className='segmented-control button-base'
      data-variant='secondary'
    />
  );
}

export function SegmentedControlItem(props: ToggleButtonProps) {
  return (
    <ToggleButton {...props} className='segmented-control-item'>
      {composeRenderProps(props.children, (children) => (
        <>
          <SelectionIndicator
            className='react-aria-SelectionIndicator button-base'
            data-selected={true}
          />
          <span>{children}</span>
        </>
      ))}
    </ToggleButton>
  );
}
