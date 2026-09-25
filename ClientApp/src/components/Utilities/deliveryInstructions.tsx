import { Col, Row } from 'react-bootstrap';

interface Props {
    deliveryInstructions?: string;
}

const DeliveryInstructions = ({ deliveryInstructions }: Props) => (
    <Col md={12}>
        {deliveryInstructions && (
            <div className='mb-4 p-4 bg-light d-print-block'>
                <h3 className='h5 mb-0'>NMI site specific receiving instructions</h3>
                <Row>
                    <Col>
                        <p className='mb-0 text-break'>
                            {!!deliveryInstructions && `${deliveryInstructions}`}
                        </p>
                    </Col>
                </Row>
            </div>
        )}
    </Col>
);

export default DeliveryInstructions;
