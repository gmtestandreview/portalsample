"use client";
import { composeRenderProps } from "react-aria-components/composeRenderProps";
import {
	ToggleButton as RacToggleButton,
	type ToggleButtonProps as RacToggleButtonProps,
} from "react-aria-components/ToggleButton";
import "./ToggleButton.css";

interface ToggleButtonProps extends RacToggleButtonProps {
	/**
	 * The visual style of the button (Vanilla CSS implementation specific).
	 *
	 * @default 'primary'
	 */
	variant?: "primary" | "secondary" | "quiet";
}

export function ToggleButton(props: ToggleButtonProps) {
	return (
		<RacToggleButton
			{...props}
			className="react-aria-ToggleButton button-base"
			data-variant={props.variant || "primary"}
		>
			{composeRenderProps(props.children, (children) => (
				<span>{children}</span>
			))}
		</RacToggleButton>
	);
}
