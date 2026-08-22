import type { PropsWithChildren } from 'react';

const handleHashLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    id: string,
    scrollToBlock?: 'center' | 'start',
): void => {
    e.preventDefault();

    const linkedElement = document.querySelector(`[id="${id.replaceAll('#', '')}"]`) as HTMLElement | null;

    // if the linked element is within an accordion, expand it and toggle the button
    const accordionHeader = linkedElement?.closest(
        '[class="accordion-collapse collapse"]',
    ) as HTMLElement | null;

    const accordionButton = linkedElement?.closest(
        '[class*="accordion-item"]',
    )?.querySelector(
        '[class="accordion-button collapsed"]',
    ) as HTMLElement | null;

    let waitForAccordionInMs = 0;
    if (accordionHeader && accordionButton) {
        accordionHeader.setAttribute('class', 'accordion-collapse collapse show');
        accordionButton.click();
        waitForAccordionInMs = 300;
    }

    setTimeout(() => {
        linkedElement?.scrollIntoView({ behavior: 'smooth', block: scrollToBlock });
        linkedElement?.focus();
    }, waitForAccordionInMs);
};

interface HashLinkProps {
    to: string,
    className?: string,
    aria?: string,
    scrollToBlock?: 'center' | 'start',
}

const HashLink = (props: PropsWithChildren<HashLinkProps>) => {
    const {
        to: href, className, aria, children, scrollToBlock,
    } = props;
    return (
        <a
            href={href}
            className={className}
            onClick={(e) => { handleHashLinkClick(e, href, scrollToBlock); }}
            aria-label={aria}
        >
            {children}
        </a>
    );
};

export default HashLink;
