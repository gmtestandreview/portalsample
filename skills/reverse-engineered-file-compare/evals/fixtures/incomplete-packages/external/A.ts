import type { Request } from '@fixture/rfq-contract';
export const label = (request: Request): string => request.id;
