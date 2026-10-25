import { render, screen } from '@testing-library/react';

import type React from 'react';

import { MemoryRouter } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';

import CustomBreadcrumb from '@/components/Breadcrumb';

const ariaLinkMockState = vi.hoisted(() => ({
  includeHref: false,
}));

vi.mock(
  import('react-aria-components/Breadcrumbs'),
  () =>
    ({
      Breadcrumbs: ({
        children,
        className,
      }: {
        children: React.ReactNode;
        className?: string;
      }) => <ol className={className}>{children}</ol>,
      Breadcrumb: ({
        children,
        className,
      }: {
        children: React.ReactNode;
        className?: string;
      }) => <li className={className}>{children}</li>,
    }) satisfies __ExactMockModule<__TestMockModule17>,
);

vi.mock(
  import('react-aria-components/Link'),
  () =>
    ({
      Link: ({
        children,
        href,
        render: renderLink,
      }: {
        children: React.ReactNode;
        href?: string;
        render?: (props: {
          children: React.ReactNode;
          href?: string;
        }) => React.ReactNode;
      }) =>
        renderLink ? (
          renderLink(
            ariaLinkMockState.includeHref && href !== undefined
              ? { children, href }
              : { children },
          )
        ) : (
          <a href={href ?? '#'}>{children}</a>
        ),
    }) satisfies __ExactMockModule<__TestMockModule18>,
);

describe('customBreadcrumb React Aria render fallback', () => {
  afterEach(() => {
    ariaLinkMockState.includeHref = false;
  });
  it('renders nothing when no breadcrumbs are provided', () => {
    expect.assertions(1);
    const { container } = render(<CustomBreadcrumb breadcrumbs={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('customBreadcrumb React Aria render fallback', () => {
  afterEach(() => {
    ariaLinkMockState.includeHref = false;
  });
  it('throws when a non-current breadcrumb has no destination', () => {
    expect.assertions(1);
    expect(() =>
      CustomBreadcrumb({
        breadcrumbs: [{ text: 'Missing link' }, { text: 'Current page' }],
      }),
    ).toThrow(
      'Breadcrumb item "Missing link" must include "to" because it is not the current page.',
    );
  });
});

describe('customBreadcrumb React Aria render fallback', () => {
  afterEach(() => {
    ariaLinkMockState.includeHref = false;
  });
  it('renders previous breadcrumb content as a span when React Aria props do not include an href', () => {
    expect.assertions(3);
    render(
      <MemoryRouter>
        <CustomBreadcrumb
          breadcrumbs={[{ to: '/', text: 'Home' }, { text: 'Request details' }]}
        />
      </MemoryRouter>,
    );

    const fallback = screen.getByText('Home');

    expect(fallback.tagName).toBe('SPAN');
    expect(
      screen.queryByRole('link', { name: 'Home' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Request details')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
