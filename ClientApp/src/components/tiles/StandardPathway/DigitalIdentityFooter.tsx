import { Card } from 'react-bootstrap';
import type { StandardPathwayFooterProps } from './types';
import DICoatOfArms from '../../../assets/DI_CoatOfArms.svg';

const DigitalIdentityFooter = (props: StandardPathwayFooterProps) => {
    const {
        linkDescription,
    } = props;
    return (
        <Card.Footer
            as='span'
            bsPrefix='standard-pathway-footer'
        >
            <img src={DICoatOfArms} alt='Australian Government Coat of Arms' className='me-3 digital-identity' />
            <span>{linkDescription}</span>
        </Card.Footer>
    );
};

export default DigitalIdentityFooter;
