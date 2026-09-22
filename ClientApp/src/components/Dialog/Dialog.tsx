"use client";
import {
	type DialogProps,
	type DialogTriggerProps,
	Dialog as RacDialog,
	DialogTrigger as RacDialogTrigger,
} from "react-aria-components/Dialog";
import "./Dialog.css";

export function Dialog(props: Readonly<DialogProps>) {
	return <RacDialog {...props} />;
}

export function DialogTrigger(props: Readonly<DialogTriggerProps>) {
	return <RacDialogTrigger {...props} />;
}

export { Heading } from "react-aria-components/Dialog";
