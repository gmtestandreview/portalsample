"use client";
import {
	ColorSlider as AriaColorSlider,
	type ColorSliderProps as AriaColorSliderProps,
	SliderOutput,
	SliderTrack,
} from "react-aria-components/ColorSlider";
import { ColorThumb } from "../ColorThumb/ColorThumb.tsx";
import { Label } from "../forms/AriaForm/Form.tsx";
import "./ColorSlider.css";

export interface ColorSliderProps extends AriaColorSliderProps {
	label?: string;
}

export function ColorSlider({ label, ...props }: ColorSliderProps) {
	return (
		<AriaColorSlider {...props}>
			<Label>{label}</Label>
			<SliderOutput />
			<SliderTrack
				style={({ defaultStyle }) => ({
					background: `${defaultStyle.background},
            repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`,
				})}
			>
				<ColorThumb />
			</SliderTrack>
		</AriaColorSlider>
	);
}
