'use client';
import {
  Text,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  type ToastProps,
  UNSTABLE_ToastRegion as ToastRegion,
} from 'react-aria-components/Toast';
import { Button } from '../../Buttons/AriaButton/Button.tsx';
import { X } from './NmiIcon.tsx';
import './Toast.css';
import type { CSSProperties } from 'react';
import { type MyToastContent, queue } from './ToastQueue.ts';

export function MyToastRegion() {
  return (
    <ToastRegion queue={queue}>
      {({ toast }) => (
        <MyToast
          toast={toast}
          style={{ viewTransitionName: toast.key } as CSSProperties}
        >
          <ToastContent>
            <Text slot='title'>{toast.content.title}</Text>
            {toast.content.description && (
              <Text slot='description'>{toast.content.description}</Text>
            )}
          </ToastContent>
          <Button slot='close' aria-label='Close' variant='quiet'>
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
