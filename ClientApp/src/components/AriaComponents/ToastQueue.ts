'use client';
import { UNSTABLE_ToastQueue as ToastQueue } from 'react-aria-components/Toast';

export interface MyToastContent {
  title: string;
  description?: string;
}

export const queue = new ToastQueue<MyToastContent>();
