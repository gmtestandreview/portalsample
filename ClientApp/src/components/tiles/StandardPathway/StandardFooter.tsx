import { Card } from 'react-bootstrap';
import type { StandardPathwayFooterProps } from './types';

const StandardPathwayFooter = (props: StandardPathwayFooterProps) => {
    const {
        linkDescription,
    } = props;
    return (
        <Card.Footer
            as='span'
            bsPrefix='standard-pathway-footer'
        >
            <i className='icon me-3' aria-hidden='true' />
            {/* <img src={IconExternalLink} alt={linkDescription} className='me-3 link' /> */}
            <span>{linkDescription}</span>
        </Card.Footer>
    );
};

export default StandardPathwayFooter;
