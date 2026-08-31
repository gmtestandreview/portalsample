'use client';
import { useMemo } from 'react';
import { Toolbar as RACToolbar, type ToolbarProps } from 'react-aria-components/Toolbar';
import { SeparatorContext } from 'react-aria-components/Separator';
import { ToggleButtonGroupContext } from 'react-aria-components/ToggleButtonGroup';
import './Toolbar.css';

export function Toolbar(props: Readonly<ToolbarProps>) {
  let { orientation = 'horizontal' } = props;
  let separatorOrientation: 'horizontal' | 'vertical' =
    orientation === 'horizontal' ? 'vertical' : 'horizontal';
  let toggleButtonGroupValue = useMemo(() => ({ orientation }), [orientation]);
  let separatorValue = useMemo(
    () => ({ orientation: separatorOrientation }),
    [separatorOrientation]
  );

  return (
    <ToggleButtonGroupContext.Provider value={toggleButtonGroupValue}>
      <SeparatorContext.Provider value={separatorValue}>
        <RACToolbar {...props} />
      </SeparatorContext.Provider>
    </ToggleButtonGroupContext.Provider>
  );
}
