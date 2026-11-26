export type Delivery = 'standard' | 'express';

const FEES = { standard: 5, express: 15 } satisfies Record<Delivery, number>;

export function shippingFee(delivery: Delivery, _subtotal: number): number {
  return FEES[delivery];
}
