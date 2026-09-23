'use client';
import {
  ToggleButtonGroup as RacToggleButtonGroup,
  type ToggleButtonGroupProps,
} from 'react-aria-components/ToggleButtonGroup';
import './ToggleButtonGroup.css';

export function ToggleButtonGroup(props: Readonly<ToggleButtonGroupProps>) {
  return <RacToggleButtonGroup {...props} />;
}
