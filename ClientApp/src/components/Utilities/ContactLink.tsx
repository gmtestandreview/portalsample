import { Link } from 'react-router';
import '../../styles/media-print.scss';
import InTextLink from '../InTextLink';

/**
 * show the Terms link and open pdf in a new tab
 * @param props MailingLabelProps
 * @returns jsx
 */
const ContactLink = () => (
    <>
        <div className='d-grid gap-2 d-md-block mb-4'>
            <Link to='/' className='btn btn-primary'>Go to dashboard</Link>
        </div>
        <p className='mb-2'>
            {'If this error continues to occur please report it to us at '}
            <InTextLink
                href='mailto:infotm@measurement.gov.au?Subject=Error on NMI Services portal'
            >
                infotm@measurement.gov.au
            </InTextLink>
        </p>
    </>
);

export default ContactLink;
