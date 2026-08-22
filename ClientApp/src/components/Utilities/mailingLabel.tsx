import { useRef, useState } from 'react';
import '../../styles/media-print.scss';
import {
    Button, Card, Col, Row,
} from 'react-bootstrap';

export interface MailingLabelProps {
    quotationIdNum?: string;
    nmiTestOfficerName?: string;
    nmiFacilityName?: string;
    nmiFacilityAddress?: string;
    showPrintOrCopy?: boolean;
}

/**
 * Encapsulates the markup and logic to display, print, and copy the mailing label
 * @param props MailingLabelProps
 * @returns jsx
 */
const MailingLabel = ({
    quotationIdNum,
    nmiTestOfficerName,
    nmiFacilityName,
    nmiFacilityAddress,
    showPrintOrCopy = true,
}: MailingLabelProps) => {
    const printAreaRef = useRef<HTMLDivElement | null>(null);

    const [isCopyClipboard, setIsCopyClipboard] = useState(false);

    /**
     * React-To-Print handle the Print button click
     */
    const handlePrint = () => {
        globalThis.print();
    };

    /**
     * Copies the mailing label text to the clipboard
     */
    const copyToClipboardClick = () => {
        /* v8 ignore next 3 */
        if (!printAreaRef.current) {
            setIsCopyClipboard(false);
            return;
        }

        const textToCopy = printAreaRef.current.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopyClipboard(true);
            // eslint-disable-next-line no-console
            console.log('Copied to clipboard:'); console.log(textToCopy);
        }).catch((err) => {
            setIsCopyClipboard(false);
            // eslint-disable-next-line no-console
            console.log('Failed to copy: ', err);
        });
    };

    return (
        <Col md={12}>
            <Card className='printable-card mb-4 p-3'>
                <Card.Body>
                    <Row>
                        <Col id='printable-label' ref={printAreaRef} md={9} xl={10} className='order-2 order-md-0'>
                            <p>Deliver to:</p>
                            <p>
                                {'Quotation ID: '}
                                {!!quotationIdNum && `${quotationIdNum}`}
                            </p>
                            <p className='fs-4'>
                                <strong>
                                    {'ATTN: '}
                                    {!!nmiTestOfficerName && `${nmiTestOfficerName}`}
                                    <br />
                                    {!!nmiFacilityName && `${nmiFacilityName}`}
                                    <br />
                                    {!!nmiFacilityAddress && `${nmiFacilityAddress}`}
                                </strong>
                            </p>
                        </Col>
                        <Col md={3} xl={2} className='d-print-none' hidden={!showPrintOrCopy}>
                            <div className='d-grid gap-2 d-flex flex-md-column justify-content-end text-nowrap -mt-4'>
                                <Button
                                    variant='btn btn-tertiary'
                                    onClick={handlePrint}
                                    title='Print shipping address label (opens in new window)'
                                >
                                    <i className='icon-printer me-1' aria-hidden='true' />
                                    {' '}
                                    Print
                                    <span className='visually-hidden'>shipping address label</span>
                                </Button>
                                <Button
                                    variant='btn btn-tertiary'
                                    onClick={copyToClipboardClick}
                                    title={isCopyClipboard ? 'Copied to clipboard!' : 'Copy to clipboard'}
                                >
                                    {isCopyClipboard
                                        ? (
                                            <>
                                                <i className='icon-tick me-1' aria-hidden='true' />
                                                {' '}
                                                Copied!
                                            </>
                                        )
                                        : (
                                            <>
                                                <i className='icon-copy me-1' aria-hidden='true' />
                                                {' '}
                                                Copy
                                            </>
                                        )}

                                    <span className='visually-hidden'>shipping address label to clipboard</span>
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Col>
    );
};

export default MailingLabel;
