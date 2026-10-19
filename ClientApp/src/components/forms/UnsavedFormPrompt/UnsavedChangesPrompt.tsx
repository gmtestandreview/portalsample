import RouteLeavingGuard from '../../RouteLeavingGuard';

// Browser refresh/close (onbeforeunload) is intentionally not covered — see RouteLeavingGuard stories.
// In-app navigation is blocked via useBlocker inside RouteLeavingGuard.

export interface UnsavedChangesPromptProps {
  path?: string | undefined;
  isDirty: boolean;
  /** True when the form currently has no validation errors. */
  isValid: boolean;
  submitCount: number;
  /** Runs when the user confirms leaving, e.g. to clear form errors. */
  onProceed?: (() => void) | undefined;
}

/**
 * The unsaved-changes rule, free of any form library. A shell adapter supplies
 * its own `isDirty`, `isValid` and `submitCount`.
 */
const UnsavedChangesPrompt = ({
  path,
  isDirty,
  isValid,
  submitCount,
  onProceed,
}: Readonly<UnsavedChangesPromptProps>) => {
  const isDirtyUnsaved = isDirty && (submitCount === 0 || !isValid);
  const isServerRejected = !isDirty && !isValid && submitCount > 0;
  const proceedProps = onProceed === undefined ? {} : { onProceed };

  if (path === '/create-account/' || path === '/create-contact/') {
    return (
      <RouteLeavingGuard
        when={isDirtyUnsaved}
        title='Are you sure you want to log out?'
        body='Any changes made will not be saved if you log out. You can log out, or cancel to stay on the page.'
        confirmBtn='Yes, logout'
        {...proceedProps}
      />
    );
  }

  // Block when: dirty and not yet submitted (A), dirty and invalid (B), or clean but server
  // validation rejected the last submit (C) — prevents leaving a server-rejected form even if
  // the user has not re-dirtied it.
  return (
    <RouteLeavingGuard
      when={isDirtyUnsaved || isServerRejected}
      {...proceedProps}
    />
  );
};

export default UnsavedChangesPrompt;
