"use client";
import {
	type DropZoneProps,
	DropZone as RacDropZone,
} from "react-aria-components/DropZone";
import "./DropZone.css";

export function DropZone(props: Readonly<DropZoneProps>) {
	return <RacDropZone {...props} />;
}

export { Text } from "react-aria-components/DropZone";
