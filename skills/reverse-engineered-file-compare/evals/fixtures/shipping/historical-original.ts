export type Delivery = 'standard' | 'express';

export function shippingFee(delivery: Delivery, _subtotal: number): number {
  return delivery === 'express' ? 15 : 5;
}
