import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { DashboardTab } from '../../../../ClientApp/src/components/SearchFilter/types';
import RequestForPatternApprovalCreated from '../../../../ClientApp/src/routes/ta/created';

const mocks = vi.hoisted(() => ({
    useHtmlTitle: vi.fn(),
    useBodyClass: vi.fn(),
    account: {
        details: {
            organisation: 'National Measurement Institute',
            trading: 'Trading',
            branch: 'Branch',
        },
    },
}));

vi.mock('../../../../ClientApp/src/authentication/hooks', () => ({
    default: () => mocks.account,
}));

vi.mock('../../../../ClientApp/src/components/Utilities/useHtmlTitle', () => ({
    default: mocks.useHtmlTitle,
}));

vi.mock('../../../../ClientApp/src/components/Utilities/useBodyClass', () => ({
    default: mocks.useBodyClass,
}));

vi.mock('../../../../ClientApp/src/components/forms/FormBanner', () => ({
    default: ({
        title,
        refTitle,
        subTitle,
    }: {
        title: string;
        refTitle: string;
        subTitle: string;
    }) => (
        <div data-testid='form-banner'>
            <span>{title}</span>
            <span>{refTitle}</span>
            <span>{subTitle}</span>
        </div>
    ),
}));

const renderCreatedRoute = () => render(
    <MemoryRouter initialEntries={['/ta/PA-200/created']}>
        <Routes>
            <Route path='/ta/:id/created' element={<RequestForPatternApprovalCreated />} />
            <Route path='/dashboard-ta' element={<div>Pattern approval dashboard</div>} />
        </Routes>
    </MemoryRouter>,
);

const expectDashboardTabStorage = () => {
    expect(globalThis.sessionStorage.getItem('set-tabop-after-save')).toBe(
        JSON.stringify(DashboardTab.Requests),
    );
};

describe('RequestForPatternApprovalCreated', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.sessionStorage.clear();
    });

    it('renders the submitted reference and page chrome metadata', () => {
        renderCreatedRoute();

        expect(mocks.useHtmlTitle).toHaveBeenCalledWith(
            'Application for Pattern/type approval created successfully | NMI Services portal',
        );
        expect(mocks.useBodyClass).toHaveBeenCalledWith('application-created');
        expect(screen.getByTestId('form-banner')).toHaveTextContent('Pattern/type approval - Application');
        expect(screen.getByTestId('form-banner')).toHaveTextContent('Ref ID: PA-200');
        expect(screen.getByTestId('form-banner')).toHaveTextContent('Trading - Branch - National Measurement Institute');
        expect(screen.getByRole('heading', { name: 'Your application has been submitted' })).toBeInTheDocument();
        expect(screen.getByTestId('application-submit-success')).toHaveTextContent('PA-200');
    });

    it('sets the dashboard tab marker and navigates when the dashboard button is clicked', () => {
        renderCreatedRoute();

        fireEvent.click(screen.getByTestId('go-to-dashboard-button'));

        expectDashboardTabStorage();
        expect(screen.getByText('Pattern approval dashboard')).toBeInTheDocument();
    });

    it('sets the dashboard tab marker when the dashboard text link is followed', () => {
        renderCreatedRoute();

        fireEvent.click(screen.getByRole('link', { name: 'dashboard' }));

        expectDashboardTabStorage();
        expect(screen.getByText('Pattern approval dashboard')).toBeInTheDocument();
    });
});
