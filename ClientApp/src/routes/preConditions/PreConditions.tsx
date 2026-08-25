import { useIsAuthenticated } from '@azure/msal-react';
import { Navigate, useLocation } from 'react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccountState, useAccountDispatch } from '../../authentication/hooks';
import Layout from '../../components/Layout';
import TermsAndConditionModal from '../../components/modals/TermsAndCondition';
import {
    clearDashboardNotification,
    getBranchModalNotification,
} from '../../storage/notification';
import BranchSelectorModal from '../../components/modals/BranchSelectorModal';
import RouteChangeScrollTop from '../../components/Utilities/routeChangeScrollTop';
import BackToTopButton from '../../components/Utilities/backToTopButton';
import { useRouteAccessibility } from '../../hooks/useRouteAccessibility';
import RFQDeleteModal from '../../components/modals/RFQDeleteModal';
import { ModalStateCtx, ModalDispatchCtx } from '../../components/modals/ModalContext';
import type { ModalState } from '../../components/modals/ModalContext';
import { BranchSelectionModalMode } from '../../components/modals/BranchSelectorModal/enums';

export interface PreConditionsProps {
    children: any;
    displayHeaderAndFooter?: boolean;
}

const PreConditions = (props: PreConditionsProps) => {
    const { children, displayHeaderAndFooter } = props;
    const isAuthenticated = useIsAuthenticated();
    const accountState = useAccountState();
    const accountDispatch = useAccountDispatch();
    const account = accountState && accountDispatch ? { ...accountState, ...accountDispatch } : null;
    const location = useLocation();
    const path = location.pathname;
    const { announcement } = useRouteAccessibility();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [modalState, setModalState] = useState<ModalState>(() => ({
        showBranchSelector: !!getBranchModalNotification(),
        showRFQDeleteModal: false,
        branchSelectionModalMode: BranchSelectionModalMode.SelectAndEditOrg,
    }));

    const setShowBranchSelector = useCallback((show: boolean) => {
        setModalState((prev) => ({
            ...prev,
            showBranchSelector: show,
            branchSelectionModalMode: BranchSelectionModalMode.SelectAndEditOrg,
        }));
    }, []);

    const setShowRFQDeleteModal = useCallback((show: boolean, rfqId: string) => {
        setModalState((prev) => ({ ...prev, showRFQDeleteModal: show, rfqId }));
    }, []);

    const setShowRFQSelectModal = useCallback((show: boolean, rfqId: string, callingPath: string) => {
        setModalState((prev) => ({
            ...prev,
            showBranchSelector: show,
            branchSelectionModalMode: BranchSelectionModalMode.RFQSelectOrg,
            rfqId,
            callingPath,
        }));
    }, []);

    const modalDispatch = useMemo(
        () => ({ setShowBranchSelector, setShowRFQDeleteModal, setShowRFQSelectModal }),
        [setShowBranchSelector, setShowRFQDeleteModal, setShowRFQSelectModal],
    );

    const redirectToCreateAccount = isAuthenticated
    && account?.details?.defaultOrganisationId !== null
    && account?.details?.accountCreationCompleted === false
    && !path?.includes('create-account');

    const redirectToCreateContact = isAuthenticated
    && !redirectToCreateAccount
    && account?.details?.accountContactCompleted === false
    && !path?.includes('create-contact')
    && !path?.includes('create-account');

    const redirectToDashboard = isAuthenticated
    && account?.details?.accountCreationCompleted === true
    && account?.details?.accountContactCompleted === true
    && (path?.includes('create-account') === true
        || path?.includes('create-contact') === true);

    const showTermsAndConditions = isAuthenticated
    && account?.details?.userAcceptedTermsOfUse === false;

    const autoShowBranchSelector = !!(isAuthenticated
    && account?.details?.userAcceptedTermsOfUse === true
    && account?.details?.defaultOrganisationId === null
    && account?.details?.accountContactCompleted === true
    && !path?.includes('success-creating-account'));

    const showBranchSelector = autoShowBranchSelector || modalState.showBranchSelector;
    const showRFQDelete = modalState.showRFQDeleteModal;

    useEffect(() => {
        if (autoShowBranchSelector && !modalState.showBranchSelector) {
            setModalState((prev) => ({
                ...prev,
                showBranchSelector: true,
                branchSelectionModalMode: BranchSelectionModalMode.SelectAndEditOrg,
            }));
        }
    }, [autoShowBranchSelector, modalState.showBranchSelector]);

    useEffect(() => {
        if (path && path !== '/' && !path.includes('dashboard')) {
            clearDashboardNotification();
        }
    }, [path]);

    useEffect(() => {
        setIsModalOpen(
            !!(showBranchSelector || showRFQDelete || showTermsAndConditions),
        );
    }, [showBranchSelector, showRFQDelete, showTermsAndConditions, isModalOpen]);

    const renderWithLayout = () => (
        <Layout>
            {children}
            {showTermsAndConditions
                ? <TermsAndConditionModal />
                : null}
            {showBranchSelector
                ? <BranchSelectorModal />
                : null}
            {showRFQDelete
                ? <RFQDeleteModal />
                : null}
        </Layout>
    );

    const renderWithoutLayout = () => (
        <>
            {children}
            {showTermsAndConditions
                ? <TermsAndConditionModal />
                : null}
            {showBranchSelector
                ? <BranchSelectorModal />
                : null}
            <BackToTopButton />
            <span className='visually-hidden' role='status' aria-live='polite'>
                {announcement}
            </span>
            <RouteChangeScrollTop />
        </>
    );

    if (redirectToCreateAccount) {
        return <Navigate to='/create-account' />;
    }

    if (redirectToCreateContact) {
        return <Navigate to='/create-contact' />;
    }

    if (redirectToDashboard) {
        return <Navigate to='/' />;
    }

    return (
        <ModalStateCtx.Provider value={modalState}>
            <ModalDispatchCtx.Provider value={modalDispatch}>
                {/* For WCAG - DIV wrapper work around for HTML "inert" tag not yet included in ReactJS v18 */}
                <div {...{ inert: isModalOpen ? '' : undefined }}>
                    {displayHeaderAndFooter
                        ? renderWithLayout()
                        : renderWithoutLayout()}
                </div>
            </ModalDispatchCtx.Provider>
        </ModalStateCtx.Provider>
    );
};

export default PreConditions;
