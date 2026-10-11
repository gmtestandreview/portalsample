import {
  ColorThumb as AriaColorThumb,
  type ColorThumbProps,
} from 'react-aria-components/ColorThumb';
import './ColorThumb.css';

export function ColorThumb(props: Readonly<ColorThumbProps>) {
  return <AriaColorThumb {...props} />;
}
