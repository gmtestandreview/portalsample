'use client';
import {
  UNSTABLE_ToastRegion as ToastRegion,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  type ToastProps,
  Text,
} from 'react-aria-components/Toast';
import { Button } from './Button';
import { X } from 'lucide-react';
import './Toast.css';
import { type CSSProperties } from 'react';
import { queue, type MyToastContent } from './ToastQueue';

export function MyToastRegion() {
  return (
    <ToastRegion queue={queue}>
      {({ toast }) => (
        <MyToast toast={toast} style={{ viewTransitionName: toast.key } as CSSProperties}>
          <ToastContent>
            <Text slot="title">{toast.content.title}</Text>
            {toast.content.description && (
              <Text slot="description">{toast.content.description}</Text>
            )}
          </ToastContent>
          <Button slot="close" aria-label="Close" variant="quiet">
            <X size={16} />
          </Button>
        </MyToast>
      )}
    </ToastRegion>
  );
}

export function MyToast(props: Readonly<ToastProps<MyToastContent>>) {
  return <Toast {...props} />;
}
