"use client";
import {
	type ModalOverlayProps,
	Modal as RacModal,
} from "react-aria-components/Modal";
import "./Modal.css";

export function Modal(props: ModalOverlayProps) {
	return <RacModal {...props} />;
}
