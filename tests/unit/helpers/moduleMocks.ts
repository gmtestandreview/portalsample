import { vi } from 'vitest';

const defineMockValue = (target: object, key: PropertyKey, value: unknown) => {
    try {
        Object.defineProperty(target, key, {
            configurable: true,
            writable: true,
            value,
        });

        return true;
    } catch {
        return false;
    }
};

export const mockOpen = () => {
    const open = vi.fn<typeof globalThis.open>();
    defineMockValue(globalThis, 'open', open);

    return open;
};

export const mockLocationAssign = () => {
    const assign = vi.fn<(url: string | URL) => void>();

    defineMockValue(globalThis.location, 'assign', assign);

    if (globalThis.location.assign === assign) {
        return assign;
    }

    defineMockValue(globalThis, 'location', {
        ...globalThis.location,
        assign,
    });

    if (globalThis.location.assign !== assign) {
        throw new Error(
            'Unable to mock window.location.assign because this jsdom version does not allow replacing it. Mock an app-level navigation wrapper instead.',
        );
    }

    return assign;
};

export const flushPromises = () => new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, 0);
});
