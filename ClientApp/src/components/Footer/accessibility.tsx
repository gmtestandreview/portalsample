import type { ReactElement } from 'react';
import InTextLink from '../InTextLink';

const Accessibility = (): ReactElement => (
    <>
        <p>
            {'We are committed to providing websites that are accessible to everyone. This is a requirement under the '}
            <InTextLink href='http://www.comlaw.gov.au/Series/C2004A04426' target='_blank'>
                Disability Discrimination Act 1992
            </InTextLink>
            .
        </p>
        <p>
            {'We aim to meet the '}
            <InTextLink href='http://www.w3.org/TR/WCAG/' target='_blank'>
                Web Content Accessibility Guidelines (WCAG)
            </InTextLink>
            {' standard at level AA before 1 January 2026. This is the part of the '}
            <InTextLink href='https://www.digital.gov.au/policy/digital-experience/digital-inclusion-standard/dis-how-meet' target='_blank'>
                Digital Inclusion Standard
            </InTextLink>
            {' that Australian Government has mandated that all Government Websites are to adhere to the'}
            {' Digital Service Standard Version 2.2 before 1 January 2026.'}
        </p>
        <p>Our regular accessibility audits will also ensure we keep our websites accessible into the future.</p>
        <h4>Portable Document Format (PDF) files</h4>
        <p>
            To view PDF files on this website you will need PDF reader software. You can download and install the free&nbsp;
            <InTextLink href='http://www.adobe.com/' target='_blank'>Adobe PDF reader</InTextLink>
      &nbsp;from the Adobe website.
        </p>
        <p>
            While we work towards making our PDF files fully accessible, we&apos;ve provided alternative formats where
            possible.
        </p>
        <h4>JavaScript</h4>
        <p>
            You must have JavaScript enabled in your browser settings to use our website. JavaScript is a web programming
            language that helps our website work.
        </p>
        <p>
            To find out how to enable JavaScript in your browser, visit&nbsp;
            <InTextLink href='http://enable-javascript.com/' target='_blank'>enable-javascript.com</InTextLink>
            .
        </p>
        <h4>Contact us</h4>
        <p>We want our website to meet the highest accessibility level possible.</p>
        <p>
            If you&apos;re having difficulty accessing our documents or experience any accessibility or
            usability issues with our website please&nbsp;
            <InTextLink href='https://www.industry.gov.au/national-measurement-institute#contact-footer' target='_blank'>contact us</InTextLink>
            .
        </p>
    </>
);

export default Accessibility;
