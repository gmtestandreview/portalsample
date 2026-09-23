'use client';
import { Button } from 'react-aria-components/Button';
import {
  ColorPicker as AriaColorPicker,
  type ColorPickerProps as AriaColorPickerProps,
} from 'react-aria-components/ColorPicker';
import { Popover } from '../react-aria-evaluation/primitives/Popover.tsx';
import { ColorArea } from '../ColorArea/ColorArea.tsx';
import { ColorField } from '../ColorField/ColorField.tsx';
import { ColorSlider } from '../ColorSlider/ColorSlider.tsx';
import { ColorSwatch } from '../ColorSwatch/ColorSwatch.tsx';
import { DialogTrigger } from '../Dialog/Dialog.tsx';
import './ColorPicker.css';

export interface ColorPickerProps extends Omit<
  AriaColorPickerProps,
  'children'
> {
  label?: string;
  children?: React.ReactNode;
}

export function ColorPicker({
  label,
  children,
  ...props
}: Readonly<ColorPickerProps>) {
  return (
    <AriaColorPicker {...props}>
      <DialogTrigger>
        <Button className='color-picker'>
          <ColorSwatch />
          <span>{label}</span>
        </Button>
        <Popover
          hideArrow={true}
          placement='bottom start'
          className='color-picker-dialog'
        >
          {children || (
            <>
              <ColorArea
                colorSpace='hsb'
                xChannel='saturation'
                yChannel='brightness'
              />
              <ColorSlider colorSpace='hsb' channel='hue' />
              <ColorField label='Hex' />
            </>
          )}
        </Popover>
      </DialogTrigger>
    </AriaColorPicker>
  );
}
