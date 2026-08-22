import { Col, Row } from 'react-bootstrap';

export interface ContactDetailsProps {
    label: string;
    name?: string;
    businessPhone?: string;
    mobilePhone?: string;
    email?: string;
}

const contactDetails = (props: ContactDetailsProps) => {
    const {
        label, name, businessPhone, mobilePhone, email,
    } = props;
    return (
        <>
            <Row>
                <h4 className='h6 mb-0'>{label}</h4>
            </Row>
            <Row>
                <Col className='fw-bold small'>Name:</Col>
                <Col className='small'>{name}</Col>
            </Row>
            <Row>
                <Col className='fw-bold small'>Business phone:</Col>
                <Col className='small'>{businessPhone}</Col>
            </Row>
            <Row>
                <Col className='fw-bold small'>Mobile phone:</Col>
                <Col className='small'>{mobilePhone}</Col>
            </Row>
            <Row>
                <Col className='fw-bold small'>Email:</Col>
                <Col className='small text-break'>{email}</Col>
            </Row>
        </>
    );
};

export default contactDetails;
