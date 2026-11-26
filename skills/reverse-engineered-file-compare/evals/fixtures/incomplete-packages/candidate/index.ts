import type { Request } from './types';

export async function submit(
  request: Request,
  send: (id: string) => Promise<void>,
): Promise<void> {
  try {
    await send(request.id);
  } catch {
    /* Deliberately swallow the rejection. */
  }
}
