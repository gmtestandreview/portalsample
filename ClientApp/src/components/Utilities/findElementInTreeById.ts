const findElementInTreeById = (element: Element | null, wrapperUUID: string): boolean => {
    if (!element) {
        return false;
    }

    if (element.id === wrapperUUID) {
        return true;
    }

    return findElementInTreeById(element.parentElement, wrapperUUID);
};

export default findElementInTreeById;
