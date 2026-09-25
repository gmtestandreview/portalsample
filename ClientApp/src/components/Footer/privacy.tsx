import type { ReactElement } from 'react';

const Privacy = (): ReactElement => (
    <>
        <section aria-labelledby='privacy-act'>
            <h4 id='privacy-act'>The Privacy Act and your personal information</h4>
            <p>
                Your personal information is protected by law, including the{' '}
                <i>Privacy Act 1988</i>
                {' ('}
                <strong>Privacy Act</strong>
                {') and the Australian Privacy Principles ('}
                <strong>APPs</strong>
                {').'}
            </p>
            <p>
                The National Measurement Institute{' ('}
                <strong>NMI</strong>
                {'), within the Department of Industry, Science and Resources (the '}
                <strong>Department</strong>
                {') collects, uses and discloses your personal information to provide measurement '}
                services to the public.
            </p>
            <hr className='mb-3 border-0' />
        </section>
        <section aria-labelledby='info-collected'>
            <h4 id='info-collected'>Types of personal information collected</h4>
            <p>
                The Department will collect your
                personal information to process requests for services and quotation in relation
                to measurement calibration services{' '}
                <strong>including:</strong>
            </p>
            <ul>
                <li>Name</li>
                <li>Address</li>
                <li>Email Address</li>
                <li>Telephone Numbers</li>
                <li>Personal Business Contact Details (Phone and Email)</li>
                <li>Job position</li>
                <li>
                    Organisation details
                    <ul>
                        <li>ABN</li>
                        <li>Business website address (optional)</li>
                        <li>Business email address (optional)</li>
                        <li>Business street address</li>
                        <li>Business postal address</li>
                        <li>Business phone</li>
                        <li>Mobile phone</li>
                    </ul>
                </li>
                <li>MyGovID Identifier</li>
                <li>Information about services they have accessed or attempted to access</li>
                <li>
                    information on the method of access such as information about their browser, such as their operating system and
                    user session
                </li>
                <li>Their internet provider number (IP address)</li>
                <li>the date and time your identity was verified.</li>
            </ul>
            <p>
                Without this information, you or your business will be
                unable to be provided with measurement services.
            </p>
            <hr className='mb-3 border-0' />
        </section>
        <section aria-labelledby='how-collections'>
            <h4 id='how-collections'>How collection occurs</h4>
            <p>
                We collect
                your personal information where it is reasonably necessary for or directly
                related to the performance of our functions or activities.
            </p>
            <p>
                The Department may collect personal
                information directly from you or another person, as part of applications you
                submit through the Portal.
            </p>
            <p>
                We collect this personal information from you at the time you submit your application to us.
            </p>
            <hr className='mb-3 border-0' />
        </section>
        <section aria-labelledby='disclose-info'>
            <h4 id='disclose-info'>How do we use and disclose your personal information?</h4>
            <p>
                The Department may use or disclose your personal information for purposes, including:
            </p>
            <ul>
                <li>To provide measurement services</li>
                <li>To respond to a query or request for quotation</li>
            </ul>
            <hr className='mb-3 border-0' />
        </section>
        <section aria-labelledby='info-marketing'>
            <h4 id='info-marketing'>Will my personal information be used for marketing purposes?</h4>
            <p>
                Your personal information will not be shared, used or sold to a third-party. Your personal information will also not
                be used for marketing purposes.
            </p>
            <hr className='mb-3 border-0' />
        </section>
        <section aria-labelledby='no-info'>
            <h4 id='no-info'>What happens if you do not provide your information?</h4>
            <p>
                If you do not provide your personal information, we will be unable to process your request for measurement
                calibration services.
            </p>
            <hr className='mb-3 border-0' />
        </section>
        <section aria-labelledby='disclose-personal'>
            <h4 id='disclose-personal'>Who do we disclose your personal information to?</h4>
            <p>
                NMI does not usually disclose your personal
                information outside the Department, unless an exception under the Privacy Act
                applies.
            </p>
            <hr className='mb-3 border-0' />
        </section>
        <section aria-labelledby='privacy-practices'>
            <h4 id='privacy-practices'>How do you find out more about our privacy practices?</h4>
            <p>
                The Department&apos;s Privacy Policy gives more detail about how
                the Department manages personal information. It outlines how you may access
                your personal information the Department holds and seek the correction of it.
                The policy also provides information on how an individual may complain about a
                breach of the Australian Privacy Principles and how the complaint will be dealt
                with. A copy of the Department&apos;s Privacy Policy is available on the
                Department&apos;s website at:
            </p>
            <p>
                <a
                    href='https://www.industry.gov.au/publications/privacy-policy'
                    target='_blank'
                    rel='noreferrer'
                >
                    https://www.industry.gov.au/publications/privacy-policy
                </a>
            </p>
            <p>
                Personal information obtained will be stored and held in
                accordance with the Department&apos;s obligations under the{' '}
                <i>Archives Act 1983</i>
                {' (Cth) and '}
                <i>Privacy Act 1988</i>
                {' (Cth).'}
            </p>
            <p>
                To find out more
                about how we manage personal
                information and for any assistance with completing the template, please email
                our{' '}
                <strong>Privacy Team</strong>
                {' at '}
                <a href='mailto:privacy@industry.gov.au'>privacy@industry.gov.au</a>
                {'.'}
            </p>
            <p>
                From time to time, we will review and revise this privacy
                collection notice. We reserve the right to amend this notice at any time.
            </p>
            <hr className='mb-3 border-0' />
        </section>
        <section aria-labelledby='privacy-updated'>
            <p id='privacy-updated'>
                <strong>Date last updated:</strong>
                {' 9 July, 2024'}
            </p>
            <hr className='mb-3 border-0' />
        </section>
    </>
);

export default Privacy;
