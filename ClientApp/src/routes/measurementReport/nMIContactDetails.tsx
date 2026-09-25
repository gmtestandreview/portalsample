import { Col, Row } from 'react-bootstrap';
import type { RequestForQuoteDetails } from '../../api/web-api-client';

const NMIContactDetails = (props: { quotationData: RequestForQuoteDetails | undefined }) => {
    const { quotationData } = props;
    const mailtoSubject = encodeURIComponent(`Reviewing Quotation ID: ${quotationData?.quotationIdNum ?? ''}`);

    return (
        <Row className='mb-3'>
            <Col md={12}>
                <div className='p-4 bg-light'>
                    <h3 className='h5 mb-0'>Contact your NMI test officer if you have any questions about the report outcomes.</h3>
                    {/* Render field label + values
                                    Use SummaryDisplay components instead (TBC)
                                    */}
                    <Row>
                        <Col xs={4} md={2}>
                            <div className='-form-label text-nowrap mb-0'>Test officer:</div>
                        </Col>
                        <Col xs={8} md={10}>
                            <p className='mb-0 text-break'>{quotationData?.nmiTestOfficerName}</p>
                        </Col>
                        <Col xs={4} md={2}>
                            <div className='-form-label mb-0'>Telephone:</div>
                        </Col>
                        <Col xs={8} md={10}>
                            <p className='mb-0 text-break'>
                                {quotationData?.nmiTestOfficerPhone && (
                                    <a href={`tel:${quotationData?.nmiTestOfficerPhone}`}>
                                        {quotationData?.nmiTestOfficerPhone}
                                    </a>
                                )}
                            </p>
                        </Col>
                        <Col xs={4} md={2}>
                            <div className='-form-label mb-0'>Email:</div>
                        </Col>
                        <Col xs={8} md={10}>
                            <p className='mb-0 text-break'>
                                {quotationData?.nmiTestOfficerEmail && (
                                    <a href={`mailto:${quotationData?.nmiTestOfficerEmail}?subject=${mailtoSubject}`}>
                                        {quotationData?.nmiTestOfficerEmail}
                                    </a>
                                )}
                            </p>
                        </Col>
                    </Row>
                </div>
            </Col>
        </Row>
    );
};

export default NMIContactDetails;
