'use client';
import { useMemo } from 'react';
import { Toolbar as RACToolbar, type ToolbarProps } from 'react-aria-components/Toolbar';
import { SeparatorContext } from 'react-aria-components/Separator';
import { ToggleButtonGroupContext } from 'react-aria-components/ToggleButtonGroup';
import './Toolbar.css';

export function Toolbar(props: Readonly<ToolbarProps>) {
  const { orientation = 'horizontal' } = props;
  const separatorOrientation: 'horizontal' | 'vertical' =
    orientation === 'horizontal' ? 'vertical' : 'horizontal';
  const toggleButtonGroupValue = useMemo(() => ({ orientation }), [orientation]);
  const separatorValue = useMemo(
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
