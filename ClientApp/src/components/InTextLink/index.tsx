import ExternalLinkIcon from '../Icons/ExternalLinkIcon';

export type InTextLinkProps
  = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'rel'>;

const ExternalLink = () => (
    <>
        <ExternalLinkIcon className='bodyTextExternalLinkIcon' />
        <span className='visually-hidden'> Opens in a new tab</span>
    </>
);

const InTextLink = ({
    target, children, className, ...rest
}: InTextLinkProps) => {
    const rel = target === '_blank'
        ? 'nofollow noreferrer noopener'
        : undefined;

    return (
        <a {...rest} className={`nmi-in-text-link ${className ?? ''}`} rel={rel} target={target}>
            {children}
            {target === '_blank' && <ExternalLink />}
        </a>
    );
};

export default InTextLink;
