import { Container } from 'react-bootstrap';
import { HttpStatusCode } from '../../types';
import ContactLink from '../Utilities/ContactLink';
import useHtmlTitle from '../Utilities/useHtmlTitle';
import useBodyClass from '../Utilities/useBodyClass';
import HeaderIntroText from '../HeaderIntroText';

interface ErrorContent {
    body: string;
    heading: string;
    intro?: string;
    secondaryBody?: string;
    statusLabel?: string;
    title: string;
}

const retryBody = 'Please wait a few minutes before trying again or return to the dashboard to continue.';
const addressBody = 'Please check the web address you entered is correct and try again or return to the dashboard to continue.';

const serverErrorContent: ErrorContent = {
    body: 'Please wait a minute before reloading this page to try again.',
    heading: 'Oops - An unexpected error has occurred',
    secondaryBody: 'Alternatively please go back to the dashboard to start over.',
    title: 'Server error | NMI Services portal',
};

const errorContentByStatus: Partial<Record<number, ErrorContent>> = {
    [HttpStatusCode.Forbidden]: {
        body: addressBody,
        heading: 'Oops - Forbidden',
        intro: "The page you're looking for is not accessible.",
        statusLabel: String(HttpStatusCode.Forbidden),
        title: 'Forbidden | NMI Services portal',
    },
    [HttpStatusCode.NotFound]: {
        body: addressBody,
        heading: 'Oops - Page not found',
        intro: "The page you're looking for no longer exists or has moved.",
        statusLabel: String(HttpStatusCode.NotFound),
        title: 'Page not found | NMI Services portal',
    },
    [HttpStatusCode.Conflict]: {
        body: addressBody,
        heading: 'Oops - Conflict',
        intro: 'The record you are editing cannot be updated because the existing record is newer.',
        statusLabel: String(HttpStatusCode.Conflict),
        title: 'Conflict | NMI Services portal',
    },
    [HttpStatusCode.Gone]: {
        body: addressBody,
        heading: 'Oops - Not Available',
        intro: "The page you're looking for is no longer available.",
        statusLabel: String(HttpStatusCode.Gone),
        title: 'Not Available | NMI Services portal',
    },
    [HttpStatusCode.PreconditionFailed]: {
        body: retryBody,
        heading: 'Oops - A precondition failed error has occurred',
        intro: "The page you're trying to access has encountered an error.",
        statusLabel: String(HttpStatusCode.PreconditionFailed),
        title: 'Precondition Failed | NMI Services portal',
    },
    [HttpStatusCode.UnprocessableEntity]: {
        body: retryBody,
        heading: 'Oops - Unprocessable.',
        intro: "The page you're trying to access has encountered an error.",
        statusLabel: String(HttpStatusCode.UnprocessableEntity),
        title: 'Unprocessable | NMI Services portal',
    },
    [HttpStatusCode.InternalServerError]: serverErrorContent,
    [HttpStatusCode.ServiceUnavailable]: {
        body: retryBody,
        heading: 'Oops - Service unavailable.',
        intro: "The page you're trying to access has encountered an error.",
        statusLabel: String(HttpStatusCode.ServiceUnavailable),
        title: 'Service Unavailable | NMI Services portal',
    },
};

const ErrorDisplay = ({ status }: { status: number }) => {
    const content = errorContentByStatus[status] ?? serverErrorContent;

    useHtmlTitle(content.title);
    useBodyClass('http-error');

    return (
        <Container className='py-5'>
            <h1 id='page-title' tabIndex={-1}>
                {content.heading}
                {content.statusLabel && (
                    <>
                        {' '}
                        <span className='visually-hidden'>{content.statusLabel}</span>
                    </>
                )}
            </h1>
            {content.intro && (
                <HeaderIntroText className='mb-2'>
                    {content.intro}
                </HeaderIntroText>
            )}
            <p className='mb-6'>
                {content.body}
                {content.secondaryBody && (
                    <>
                        <br />
                        {content.secondaryBody}
                    </>
                )}
            </p>
            <ContactLink />
        </Container>
    );
};

export default ErrorDisplay;
