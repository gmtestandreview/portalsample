import { describe, it, expect } from 'vitest';

import { render, screen } from '@testing-library/react';

import SteppedNavigation from '@/components/SteppedNavigation';

describe(SteppedNavigation, () => {
  const steps = [
    { title: 'Organisation', path: '/organisation', completed: true },
    { title: 'Contact', path: '/contact', completed: false },
    { title: 'Summary', path: '/summary', completed: false },
  ];
  it('renders links for interactive completed and reachable prior steps', () => {
    expect.assertions(2);
    render(
      <SteppedNavigation
        activeStep={2}
        steps={steps}
        id='stepper'
        interactive
      />,
    );

    const organisationLink = screen.getByRole('link', {
      name: 'Organisation',
      hidden: true,
    });
    const contactLink = screen.getByRole('link', {
      name: 'Contact',
      hidden: true,
    });

    expect(organisationLink).toHaveAttribute('href', '/organisation');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });
});
