import { useMsal } from '@azure/msal-react';
import {
    useState, useEffect,
} from 'react';
import { useParams } from 'react-router';
import {
    Card, Row, Col, Form,
} from 'react-bootstrap';
import parse from 'html-react-parser';
import SlateEditor, { type CustomElement, serializeToHtml } from '../../../components/SlateEditor/SlateEditor';

import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';

import useBodyClass from '../../../components/Utilities/useBodyClass';

import AppLogger from '../../../instrumentation/AppLogger';
import { FilterMessages, type RequestForPatternApprovalApplicationMessage, RequestForPatternApprovalClient } from '../../../api/web-api-client';
import { tokenRequest } from '../../../authentication/authConfig';
import { formatDateTimeToString } from '../../../utils';
import CustomPagination from '../../../components/Pagination';
import BlockUISpinner from '../../../components/BlockUISpinner';
import CustomPaginationHeader from '../../../components/PaginationHeader';
import { sanitiseHtml } from '../../common/helperFunctions';

const DEFAULT_DASHBOARD_PAGESIZE = 10;

const ApplicationMessages = () => {
    const { accounts, instance } = useMsal();
    const { id } = useParams();
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [message, setMessage] = useState<RequestForPatternApprovalApplicationMessage>();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [editorResetKey, setEditorResetKey] = useState(0);
    const [refreshTick, setRefreshTick] = useState(0);
    const [messageView, setMessageView] = useState<FilterMessages>(FilterMessages.ShowAllMessages);

    useHtmlTitle('Application Messages | NMI Services portal');
    useBodyClass('pa-application-messages');

    // Slate editor state
    const initialValue: CustomElement[] = [
        {
            type: 'paragraph',
            children: [{ text: '' }],
        },
    ];
    const [value, setValue] = useState<CustomElement[]>(initialValue);

    useEffect(() => {
        const fetchMessages = async () => {
            setIsDataLoading(true);
            try {
                // Try do something useful here like fetch messages for the application and display them
                if (accounts.length > 0 && id) {
                    const client = new RequestForPatternApprovalClient();
                    const tokenResult = await instance.acquireTokenSilent({
                        ...tokenRequest,
                        account: accounts[0],
                    });
                    client.setAuthToken(tokenResult.accessToken);
                    const response = await client.getAppMessages(id, DEFAULT_DASHBOARD_PAGESIZE, currentPage, messageView, id);
                    if (response.requestForPatternApprovalMessageDetails!.currentPage) {
                        setCurrentPage(response.requestForPatternApprovalMessageDetails!.currentPage);
                    }
                    if (response.requestForPatternApprovalMessageDetails!.totalPages) {
                        setTotalPages(response.requestForPatternApprovalMessageDetails!.totalPages);
                    }
                    if (response.requestForPatternApprovalMessageDetails!.totalCount) {
                        setTotalCount(response.requestForPatternApprovalMessageDetails!.totalCount);
                    }
                    setMessage(response);
                }
            } catch (e) {
                AppLogger.error('Failed to load application messages', e as Error, { Id: id });
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchMessages();
    }, [accounts, id, instance, currentPage, refreshTick, messageView]);

    const changePage = (page: number) => {
        setCurrentPage(page);
    };

    const handleEditorSubmit = async (submittedValue: CustomElement[]) => {
        const htmlContent = serializeToHtml(submittedValue);
        const sanitizedHtmlContent = sanitiseHtml(htmlContent);

        setIsDataLoading(true);
        try {
            // Try do something useful here like fetch messages for the application and display them
            if (accounts.length > 0 && id) {
                const client = new RequestForPatternApprovalClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                client.setAuthToken(tokenResult.accessToken);
                await client.addAppMessage(id, sanitizedHtmlContent);
                setValue(initialValue);
                setEditorResetKey((prev) => prev + 1);
                setCurrentPage(1);
                setRefreshTick((prev) => prev + 1);
            }
        } catch (e) {
            AppLogger.error('Failed to submit application message', e as Error, { Id: id });
        } finally {
            setIsDataLoading(false);
        }
    };

    const renderEditor = () => (
        <SlateEditor
            key={editorResetKey}
            value={value}
            onSubmit={() => {
                handleEditorSubmit(value);
            }}
            setValue={setValue}
            placeholder='Message NMI'
        />
    );

    const messageCount = message && message.requestForPatternApprovalMessageDetails && message!.requestForPatternApprovalMessageDetails!.items!.length;

    const renderToolbar = () => (
        <>
            <Col>
                <Form.Select
                    aria-label='Select your view'
                    className='form-select w-auto'
                    value={messageView}
                    disabled={isDataLoading}
                    onChange={(e) => {
                        setMessageView(e.target.value as FilterMessages);
                        setCurrentPage(1); // reset paging when filter changes
                        setRefreshTick((prev) => prev + 1); // force refetch if already on page 1
                    }}
                >
                    <option value='1'>All Messages</option>
                    <option value='2'>NMI Messages</option>
                    <option value='3'>Portal Messages</option>
                </Form.Select>
            </Col>
            <Col className='text-end'>
                <span>
                    {!isDataLoading && messageCount !== undefined && messageCount > 0
                    && <CustomPaginationHeader currentPage={currentPage} totalCount={totalCount} pageSize={DEFAULT_DASHBOARD_PAGESIZE} />}
                </span>
            </Col>
        </>
    );

    const renderNMIAvator = (avatar: string) => (
        <div
            className='d-flex align-items-center justify-content-center rounded-circle bg-nmi-navbar mb-3 mb-sm-0 me-3'
            style={{ width: 36, height: 36 }}
        >
            <span className='fs-6 capitalized text-white'>
                {avatar}
            </span>
        </div>
    );

    const renderUserAvator = (avatar: string | undefined) => (
        <div
            className='d-flex align-items-center justify-content-center rounded-circle bg-primary mb-3 mb-sm-0 me-3'
            style={{ width: 36, height: 36 }}
        >
            <span className='fs-6 capitalized text-white'>
                {avatar || '?'}
            </span>
        </div>
    );

    const handlePaginationScroll = () => {
        const titleElement = document.getElementById('dash-type-title'); // TODO: change this to the title of the messages section when it is available
        titleElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const renderHtmlBody = (html: string) => {
        const safeHtml = sanitiseHtml(html);
        return parse(safeHtml);
    };

    const renderFooter = (footer: string) => (
        footer && (
            <>
                <p className='mt-2 mb-0'>Regards,</p>
                <p className='my-0'>{footer}</p>
            </>
        )
    );

    return (
        <>
            <Row id='appl-messages-editor' className='mb-0'>
                {renderEditor()}
            </Row>
            <Row id='appl-messages-toolbar' className='align-items-center mb-4'>
                {renderToolbar()}
            </Row>
            <Row id='application-messages' className='message-items mb-4'>
                {isDataLoading
                    ? (
                        <BlockUISpinner partial>
                            <p>Loading...</p>
                        </BlockUISpinner>
                    ) : (
                        <ol className='list-unstyled'>
                            {message && messageCount !== undefined && messageCount === 0 && (
                                <p className='text-center text-muted'>No messages to display</p>
                            )}
                            {message && messageCount !== undefined && messageCount > 0 && (
                                message!.requestForPatternApprovalMessageDetails!.items!.map((msg) => (
                                    <li key={msg.id} id={msg.id}>
                                        <Card
                                            className='border-0 border-bottom mb-1 shadow-sm'
                                            tabIndex={0}
                                        >
                                            <Card.Body className={`p-3 ${msg.messageRead ? 'read' : 'unread'}`}>
                                                <div className='d-flex flex-row mb-2'>
                                                    <div
                                                        className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0 '
                                                        title={msg.senderName}
                                                    >
                                                        {msg.avatar === 'NMI'
                                                            ? renderNMIAvator(msg.avatar)
                                                            : renderUserAvator(msg.avatar)}
                                                    </div>
                                                    <div className='flex-row flex-grow-1'>
                                                        <p className='d-flex flex-column flex-md-row justify-content-md-between mt-2 mb-1'>
                                                            <span>
                                                                <strong>
                                                                    {msg.subject}
                                                                </strong>
                                                            </span>
                                                            <span className='text-end small text-muted'>
                                                                {!!msg.messageSent && `${formatDateTimeToString(msg.messageSent)}`}
                                                            </span>
                                                        </p>
                                                        {typeof msg.body === 'string' ? (
                                                            <>
                                                                <div
                                                                    className='body-text'
                                                                >
                                                                    {renderHtmlBody(msg.body)}
                                                                </div>
                                                                {renderFooter(msg.footer!)}
                                                            </>

                                                        ) : (
                                                            <div
                                                                className='body-text'
                                                            >
                                                                {msg.body}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </li>
                                ))
                            )}
                        </ol>
                    )}
            </Row>
            <Row>
                <Col>
                    {!isDataLoading && (
                        <CustomPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page: number) => {
                                changePage(page);
                                handlePaginationScroll();
                            }}
                            containerClassName='d-flex justify-content-center'
                        />
                    )}
                </Col>
            </Row>
        </>
    );
};

export default ApplicationMessages;
