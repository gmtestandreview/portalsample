import { Card } from 'react-bootstrap';
import DiCoatOfArms from '../../../assets/DI_CoatOfArms.svg';
import type { StandardPathwayFooterProps } from './types.ts';

const DigitalIdentityFooter = (props: StandardPathwayFooterProps) => {
  const { linkDescription } = props;
  return (
    <Card.Footer as='span' bsPrefix='standard-pathway-footer'>
      <img
        src={DiCoatOfArms}
        alt='Australian Government Coat of Arms'
        className='me-3 digital-identity'
      />
      <span>{linkDescription}</span>
    </Card.Footer>
  );
};

export default DigitalIdentityFooter;
