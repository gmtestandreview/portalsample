export const APPLICATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/;
export const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

export const getValidApplicationId = (id: string | undefined): string | null => {
    if (!id || !APPLICATION_ID_PATTERN.test(id)) {
        return null;
    }

    return id;
};

export const getValidPositiveIntegerId = (id: string | undefined): number | null => {
    if (!id || !POSITIVE_INTEGER_PATTERN.test(id)) {
        return null;
    }

    const parsed = Number(id);
    return Number.isSafeInteger(parsed) ? parsed : null;
};
