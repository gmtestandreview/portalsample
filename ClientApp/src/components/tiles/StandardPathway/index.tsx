import { Card } from 'react-bootstrap';
import { Link } from 'react-router';
import BodyText from '../../BodyText/index.tsx';
import DigitalIdentityFooter from './DigitalIdentityFooter.tsx';
import StandardFooter from './StandardFooter.tsx';
import type {
  StandardBasePathwayProps,
  StandardExternalPathwayProps,
  StandardInternalPathwayProps,
  StandardPathwayProps,
} from './types.ts';

const StandardPathwayBody = (props: Readonly<StandardBasePathwayProps>) => {
  const { title, bodyText, linkDescription, digitalIdentity } = props;
  return (
    <>
      <Card.Body bsPrefix='standard-pathway-body'>
        <Card.Title as='h3' className='mt-0'>
          {title}
        </Card.Title>
        {bodyText && (
          <Card.Text as='div'>
            <BodyText>{bodyText}</BodyText>
          </Card.Text>
        )}
      </Card.Body>
      {digitalIdentity ? (
        <DigitalIdentityFooter linkDescription={linkDescription} />
      ) : (
        <StandardFooter linkDescription={linkDescription} />
      )}
    </>
  );
};

const ExternalStandardPathway = (
  props: Readonly<StandardExternalPathwayProps>
) => {
  const { target, linkHref, ...rest } = props;

  const rel = target === '_blank' ? 'noopener noreferrer nofollow' : undefined;

  return (
    <Card
      as='a'
      target={target}
      bsPrefix='standard-pathway'
      href={linkHref}
      rel={rel}
    >
      {target === '_blank' && (
        <span className='visually-hidden'> Opens in a new tab</span>
      )}
      <StandardPathwayBody {...rest} />
    </Card>
  );
};

const InternalStandardPathway = (
  props: Readonly<StandardInternalPathwayProps>
) => {
  const { to, ...rest } = props;
  return (
    <Card as={Link} to={to} bsPrefix='standard-pathway' data-pii='login'>
      <StandardPathwayBody {...rest} />
    </Card>
  );
};

const StandardPathway = (props: Readonly<StandardPathwayProps>) => {
  const { type } = props;

  if (type === 'external') {
    return <ExternalStandardPathway {...props} />;
  }
  return <InternalStandardPathway {...props} />;
};

export default StandardPathway;
