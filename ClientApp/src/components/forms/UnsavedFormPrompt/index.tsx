import { useFormikContext } from 'formik';
import RouteLeavingGuard from '../../RouteLeavingGuard';

// Browser refresh/close (onbeforeunload) is intentionally not covered — see RouteLeavingGuard stories.
// In-app navigation is blocked via useBlocker inside RouteLeavingGuard.

const UnsavedFormPrompt = ({ path }: { path?: string }) => {
    const formik = useFormikContext();
    const isDirtyUnsaved = formik.dirty && (formik.submitCount === 0 || !formik.isValid);
    const isServerRejected = !formik.dirty && !formik.isValid && formik.submitCount > 0;

    if (path === '/create-account/' || path === '/create-contact/') {
        return (
            <RouteLeavingGuard
                when={isDirtyUnsaved}
                title='Are you sure you want to log out?'
                body='Any changes made will not be saved if you log out. You can log out, or cancel to stay on the page.'
                confirmBtn='Yes, logout'
            />
        );
    }

    // Block when: dirty and not yet submitted (A), dirty and invalid (B), or clean but server
    // validation rejected the last submit (C) — prevents leaving a server-rejected form even if
    // the user has not re-dirtied it.
    return (
        <RouteLeavingGuard
            when={isDirtyUnsaved || isServerRejected}
        />
    );
};

export default UnsavedFormPrompt;
