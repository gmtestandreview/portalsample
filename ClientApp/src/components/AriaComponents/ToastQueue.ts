'use client';
import { UNSTABLE_ToastQueue as ToastQueue } from 'react-aria-components/Toast';
import { flushSync } from 'react-dom';

export interface MyToastContent {
  title: string;
  description?: string;
}

export const queue = new ToastQueue<MyToastContent>({
  wrapUpdate(fn) {
    if ('startViewTransition' in document) {
      document.startViewTransition(() => {
        flushSync(fn);
      });
    } else {
      fn();
    }
  },
});
