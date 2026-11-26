import type React from 'react';

export const handleModalKeyDown = (
  event: React.KeyboardEvent<HTMLDivElement>,
) => {
  // For WCAG modals, trap keyboard focus within the modal only when Tab is pressed
  if (event.key !== 'Tab' || event.defaultPrevented) {
    return;
  }

  const container = event.currentTarget;
  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]',
    ),
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      !element.closest('[inert]') &&
      element.getClientRects().length > 0 &&
      window.getComputedStyle(element).visibility !== 'hidden',
  );

  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];
  const activeElement = container.ownerDocument.activeElement;

  if (!first || !last) {
    event.preventDefault();
    container.closest<HTMLElement>('[role="dialog"]')?.focus();
    return;
  }

  const focusIsOnControl = focusableElements.some(
    (element) => element === activeElement,
  );

  if (event.shiftKey && (activeElement === first || !focusIsOnControl)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (activeElement === last || !focusIsOnControl)) {
    event.preventDefault();
    first.focus();
  }
};
