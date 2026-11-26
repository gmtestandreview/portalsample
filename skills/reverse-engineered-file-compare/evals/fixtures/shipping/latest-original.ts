export type Delivery = 'standard' | 'express';

export function shippingFee(delivery: Delivery, subtotal: number): number {
  if (subtotal >= 100) {
    return 0;
  }

  return delivery === 'express' ? 15 : 5;
}
