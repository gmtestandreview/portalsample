'use client';
import {
  Modal,
  ModalOverlay,
  type ModalOverlayProps,
} from 'react-aria-components/Modal';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { Dialog } from '../Dialog/Dialog';
import './Sheet.css';

export function Sheet(props: Readonly<ModalOverlayProps>) {
  return (
    <ModalOverlay className='sheet-overlay'>
      <Modal className='sheet'>
        {composeRenderProps(props.children, (children) => (
          <Dialog>{children}</Dialog>
        ))}
      </Modal>
    </ModalOverlay>
  );
}

export { Heading } from 'react-aria-components/Modal';
