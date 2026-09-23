const findElementInTreeById = (
  element: Element | null,
  wrapperUuid: string
): boolean => {
  if (!element) {
    return false;
  }

  if (element.id === wrapperUuid) {
    return true;
  }

  return findElementInTreeById(element.parentElement, wrapperUuid);
};

export default findElementInTreeById;
