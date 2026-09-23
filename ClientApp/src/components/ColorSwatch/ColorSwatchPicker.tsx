'use client';
import {
  ColorSwatchPicker as AriaColorSwatchPicker,
  ColorSwatchPickerItem as AriaColorSwatchPickerItem,
  type ColorSwatchPickerItemProps,
  type ColorSwatchPickerProps,
} from 'react-aria-components/ColorSwatchPicker';
import { ColorSwatch } from './ColorSwatch.tsx';
import './ColorSwatchPicker.css';

export function ColorSwatchPicker({
  children,
  ...props
}: Readonly<ColorSwatchPickerProps>) {
  return <AriaColorSwatchPicker {...props}>{children}</AriaColorSwatchPicker>;
}

export function ColorSwatchPickerItem(
  props: Readonly<ColorSwatchPickerItemProps>
) {
  return (
    <AriaColorSwatchPickerItem {...props}>
      <ColorSwatch />
    </AriaColorSwatchPickerItem>
  );
}
