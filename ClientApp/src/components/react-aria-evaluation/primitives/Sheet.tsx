"use client";
import { composeRenderProps } from "react-aria-components/composeRenderProps";
import {
	Heading,
	Modal,
	ModalOverlay,
	type ModalOverlayProps,
} from "react-aria-components/Modal";
import { Dialog } from "../../Dialog/Dialog.tsx";
import "./Sheet.css";

export function Sheet(props: ModalOverlayProps) {
	return (
		<ModalOverlay className="sheet-overlay">
			{composeRenderProps(props.children, (children) => (
				<Modal className="sheet">
					<Dialog>{children}</Dialog>
				</Modal>
			))}
		</ModalOverlay>
	);
}

export { Heading };
