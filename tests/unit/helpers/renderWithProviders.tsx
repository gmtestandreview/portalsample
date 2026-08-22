import { render, type RenderOptions } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { MemoryRouter } from 'react-router';

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
    route?: string;
};

const Providers = ({ children, route = '/' }: PropsWithChildren<{ route?: string }>) => (
    <MemoryRouter initialEntries={[route]}>
        {children}
    </MemoryRouter>
);

export const renderWithProviders = (
    ui: ReactElement,
    { route = '/', ...options }: RenderWithProvidersOptions = {},
) => render(ui, {
    ...options,
    wrapper: ({ children }) => <Providers route={route}>{children}</Providers>,
});
