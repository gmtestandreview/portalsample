'use client';
import {
  ToggleButtonGroup as RACToggleButtonGroup,
  type ToggleButtonGroupProps,
} from 'react-aria-components/ToggleButtonGroup';
import './ToggleButtonGroup.css';

export function ToggleButtonGroup(props: Readonly<ToggleButtonGroupProps>) {
  return <RACToggleButtonGroup {...props} />;
}
