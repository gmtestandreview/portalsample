import { useEffect, useState } from 'react';
import {
    Col, Row, Container,
    Card,
    Alert,
    Button,
} from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router';

import { useMsal } from '@azure/msal-react';
import useHtmlTitle from '../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../components/Utilities/useBodyClass';
import CustomBreadcrumb, { type CustomBreadcrumbItem } from '../../components/Breadcrumb';
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import { LookupClient, type ServiceDto, ServiceType } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import AppLogger from '../../instrumentation/AppLogger';
import BlockUISpinner from '../../components/BlockUISpinner';
import useAccountContext, { useAccountDispatch } from '../../authentication/hooks';
import Details from '../../components/forms/Details';

const ServicesWeOffer = () => {
    const { accounts, instance } = useMsal();
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<ServiceType | undefined>(undefined);
    const [checkedServices, setCheckedServices] = useState<{ [key: string]: boolean }>({});
    const [defaultService, setDefaultService] = useState<ServiceType | undefined>(undefined);
    const [originalDefaultService, setOriginalDefaultService] = useState<ServiceType | undefined>(undefined);
    const [services, setServices] = useState<ServiceDto[]>([]);
    const accountContext = useAccountContext();
    const accountDispatch = useAccountDispatch();
    const accountDetails = accountContext?.details;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const isManageMode = mode === 'manage';
    const serviceSelected = accountDetails?.userProfile?.services?.find((s) => s.isDefault);
    const shouldRedirect = !isManageMode && !!serviceSelected?.service;
    const checkedCount = Object.values(checkedServices).filter(Boolean).length;
    const [showSaveError, setShowSaveError] = useState(false);

    const routeToDashboardUrl = () => {
        if (originalDefaultService === ServiceType.TestingCalibration) {
            return '/dashboard';
        }
        if (originalDefaultService === ServiceType.PatternApproval) {
            return '/dashboard-ta';
        }
        return '/services-we-offer';
    };

    const breadcrumbs: CustomBreadcrumbItem[] = [
        { to: routeToDashboardUrl(), text: 'Dashboard' },
        { to: '', text: 'Services we offer' },
    ];

    useHtmlTitle('Services we offer | NMI Services portal');
    useBodyClass('services-we-offer');

    useEffect(() => {
        const loadServices = async () => {
            try {
                if (!services.length && accounts.length > 0 && accountDetails && accountDetails.userProfile) {
                    // Raised before the token round trip, not after it. Acquiring the token is
                    // itself a network call, and while it was in flight the selector rendered with
                    // an empty service list and no spinner - which reads as "you have no services"
                    // rather than "still loading".
                    setIsLoading(true);
                    setIsDataLoading(true);
                    const client = new LookupClient();
                    const tokenResult = await instance.acquireTokenSilent({
                        ...tokenRequest,
                        account: accounts[0],
                    });
                    client.setAuthToken(tokenResult.accessToken);
                    const serviceDtos = await client.getServices();
                    setServices(serviceDtos);
                    serviceDtos.forEach((service) => {
                        const serviceLower = service.serviceType?.toString().toLocaleLowerCase();
                        if (accountDetails?.userProfile?.services) {
                            const dbService = accountDetails.userProfile.services.find((s) => s.service?.toLocaleLowerCase() === serviceLower);
                            if (dbService) {
                                setCheckedServices((prev) => ({ ...prev, [service.serviceType!]: dbService.isActive! }));
                                if (dbService.isDefault) {
                                    setDefaultService(service.serviceType);
                                    setOriginalDefaultService(service.serviceType);
                                }
                            }
                        }
                    });
                }
            } catch (e) {
                AppLogger.error('Failed to retrieve service look ups', e as Error);
            } finally {
                setIsLoading(false);
                setIsDataLoading(false);
            }
        };
        loadServices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accounts, instance, accountDetails, accountDetails?.userProfile]);

    useEffect(() => {
         
        if (shouldRedirect) {
            switch (serviceSelected.service) {
                case ServiceType.TestingCalibration:
                    navigate('/dashboard');
                    break;
                case ServiceType.PatternApproval:
                    navigate('/dashboard-ta');
                    break;
                default:
                    navigate('/services-we-offer');
                    break;
            }
        }
    }, [shouldRedirect, serviceSelected, navigate, isManageMode]);

    function setCheckedServicesFn(checked: boolean, serviceType?: ServiceType) {
        if (!checked) {
            if (defaultService === serviceType) {
                setDefaultService(undefined);
            }
        }
        setCheckedServices((prev) => ({ ...prev, [serviceType!]: checked }));
    }

    function setDefaultServiceFn(serviceType?: ServiceType) {
        setSelectedService(serviceType);
        setDefaultService(serviceType);
        setCheckedServicesFn(true, serviceType);
    }

    function routeToDashboard(serviceTypeToUse?: ServiceType) {
        switch (serviceTypeToUse) {
            case ServiceType.TestingCalibration:
                navigate('/dashboard');
                break;
            case ServiceType.PatternApproval:
                navigate('/dashboard-ta');
                break;
            default:
                break;
        }
    }

    function routeToDefaultDashboard() {
        if (!originalDefaultService) {
            setShowSaveError(true);
            return;
        }

        setShowSaveError(false);
        routeToDashboard(originalDefaultService);
    }

    async function updateUserProfileServicesOffered() {
        if (checkedCount === 0) {
            setShowSaveError(true);
            return;
        }

        if (!defaultService) {
            setShowSaveError(true);
            return;
        }

        setShowSaveError(false);

        const updatedServices = services.map((service) => {
            const serviceType = service.serviceType!;
            return {
                service: serviceType, // or serviceType.toString() if needed
                isActive: !!checkedServices[serviceType],
                isDefault: defaultService === serviceType,
            };
        });

        // Then save to user profile:
        const userProfileObject = {
            ...accountDetails?.userProfile,
            services: updatedServices,
        };
        try {
            await accountDispatch?.setUserProfile(userProfileObject);
            AppLogger.info('Services offered updated successfully in user profile.');
            routeToDashboard(defaultService);
        } catch (error) {
            AppLogger.error('Failed to update services offered in user profile.', error as Error);
        }
    }

    const renderErrors = () => (
        // TO DO - do we use the FormikError component instead?
        // errors: FormikErrors<FormikValues>, disableLinkedError?: boolean) => (
        <Alert
            variant='danger'
            role='alert'
            aria-live='assertive'
            id='form-error-summary'
            data-testid='form-error-summary'
            className='d-flex mb-3'
            tabIndex={-1}
        >
            <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                <div className='bgCircle me-3'>
                    <i className='icon-warning' aria-hidden='true' />
                </div>
            </div>
            <div>
                <Alert.Heading as='h2' className='h5 fw-normal'>
                    The following issue(s) must be corrected before you can continue:
                </Alert.Heading>
                <ul>
                    {/* {
                        map(Object.keys(errors), (key) => (
                            renderErrorListItem(key, `${keyToSentenceCase(key, 1)}${errors[key]}`, disableLinkedError)
                        ))
                    } */}
                    <li>You must select a default NMI service</li>
                    <li>You must select at least one NMI service below</li>
                </ul>
            </div>
        </Alert>
    );

    const renderServicesSelector = () => (
        <Container>
            <Row className='mb-2'>
                <Col>
                    <h2 className='mb-2'>Select the NMI services that best apply to your business</h2>
                    {/* v1
                    <HeaderIntroText>
                        <strong>
                            Add the services that best support your business, and set your preferred
                            dashboard view for a personalized experience.
                            <br />
                            This will help you access the most relevant information
                            quickly every time you log in.
                        </strong>
                    </HeaderIntroText> */}
                    {/* <p className='mb-0'>
                         <strong>Tip:</strong>
                        {' Please select at least one service to continue.'}
                        <br />
                        {' You can always come back and add more services later from your User settings menu > Manage NMI services.'}
                        {/* {' You can add multiple services by selecting the checkbox next to each service. '}
                        {'And if you can select your default dashboard service view by selecting the radio button for each service. '} * /}
                    </p> */}
                    {/* v2 */}
                    <Details
                        id='services-help'
                        title='What&apos;s this?'
                        inlineHelp={(
                            <>
                                <ol className='mb-2'>
                                    <li>
                                        <strong>Choose your default dashboard view (radio buttons)</strong>
                                        <br />
                                        Select the main service you&apos;ll use as your default. Please select at least one service to continue.
                                    </li>
                                    <li>
                                        <strong>Add additional services (optional checkboxes)</strong>
                                        <br />
                                        Select any extra services you&apos;d like to access.
                                    </li>
                                </ol>
                                <p className='small'>
                                    <strong>Tip:</strong>
                                    {' You can always come back and add more services later here from your Dashboard or '
                                    + 'User settings menu > Manage NMI services.'}
                                </p>
                            </>
                        )}
                    />
                </Col>
            </Row>
            {isDataLoading
                ? (
                    <Row>
                        <BlockUISpinner partial>
                            <p>Loading data...</p>
                        </BlockUISpinner>
                    </Row>
                )
                : (
                    <>
                        <Row className='mb-0'>
                            {showSaveError && renderErrors()}
                        </Row>
                        <Row className='mb-5'>
                            <p className='d-flex justify-content-between mb-2'>
                                <span className='justify-content-start ms-4 fw-bold small'>Set default view</span>
                                {/* <span className='visually-hidden'>{' and/or '}</span> */}
                                {/* <span className='justify-content-end fw-bold small'>Select all services</span> */}
                            </p>
                            <fieldset
                                id='service-selector'
                                className='w-100 px-0'
                                role='group'
                                tabIndex={-1}
                            >
                                <legend className='h5 visually-hidden'>
                                    Set your default view and/or add more NMI services to your account
                                </legend>
                                {services && services.map((service) => (
                                    <Card
                                        key={service.serviceType}
                                        className={`mb-4 border border-3 border-light ${
                                            (selectedService || defaultService) === service.serviceType
                                                ? 'selected-service'
                                                : ''
                                        }`}
                                    >
                                        <Card.Body className='d-flex align-items-start p-0'>
                                            <div className='form-field-container col-9 mb-0' tabIndex={-1}>
                                                <div className='radio-button p-4'>
                                                    <input
                                                        type='radio'
                                                        id={`radio-${service.serviceType}`}
                                                        name='service-radio'
                                                        checked={defaultService === service.serviceType}
                                                        onChange={() => setDefaultServiceFn(service.serviceType)}
                                                        className='form-field me-2'
                                                        // aria-label={service.title}
                                                    />
                                                    <label htmlFor={`radio-${service.serviceType}`} className='border-0'>
                                                        <span className='ms-5 pt-1'>
                                                            <i
                                                                className={`${service.icon || 'icon-file'} me-3 p-2 fs-2 text-placeholder`}
                                                                aria-hidden='true'
                                                                role='presentation'
                                                            />
                                                        </span>
                                                        <span className='d-flex flex-column mb-2 pt-1'>
                                                            <span className='h3 mb-1'>{service.title}</span>
                                                            <span className='body-text mb-3'>{service.description}</span>
                                                            <span className='body-text small fs-6 lh-sm'>{service.meta}</span>
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className='form-field-container mb-0 mx-auto pt-2'>
                                                <div className='checkbox p-4'>
                                                    <input
                                                        type='checkbox'
                                                        id={`checkbox-${service.serviceType}`}
                                                        name='service-checkbox'
                                                        checked={!!checkedServices[service.serviceType!]}
                                                        onChange={(e) => setCheckedServicesFn(e.target.checked, service.serviceType)}
                                                        className='me-2'
                                                    />
                                                    <label htmlFor={`checkbox-${service.serviceType}`}>
                                                        <i className='icon-tick me-1' aria-hidden='true' role='presentation' />
                                                        <span className='text-nowrap'>
                                                            {'Add '}
                                                            <span className='d-none d-md-inline-block'>service</span>
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </fieldset>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <div className='mt-5 d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
                                    <Button
                                        hidden={!originalDefaultService}
                                        data-testid='go-to-dashboard-button'
                                        variant='tertiary'
                                        onClick={() => routeToDefaultDashboard()}
                                    >
                                        <i className='icon-close me-1' aria-hidden='true' />
                                        Cancel
                                    </Button>
                                    <PrimaryButton
                                        data-testid='save-button'
                                        onClick={() => updateUserProfileServicesOffered()}
                                        className='ms-md-auto'
                                    >
                                        Save and continue
                                    </PrimaryButton>
                                </div>
                            </Col>
                        </Row>
                    </>
                )}
        </Container>
    );

    if (!isManageMode && (!accountDetails || !accountDetails.userProfile || !accountDetails.userProfile.services)) {
        return (
            <BlockUISpinner>
                <p>Checking assigned services...</p>
            </BlockUISpinner>
        );
    }

    if (shouldRedirect) {
        return null; // or <BlockUISpinner> if you want a spinner
    }

    return (
        <>
            {/*   {isLoading && (
                <BlockUISpinner partial>
                    <p>Loading...</p>
                </BlockUISpinner>
            )} */}
            <div aria-busy={isLoading} aria-live='off'>
                <Container fluid className='default-banner-background mb-5'>
                    <Container>
                        <Row>
                            <Col hidden={!originalDefaultService}>
                                <CustomBreadcrumb breadcrumbs={breadcrumbs} />
                            </Col>
                        </Row>
                        <Row className='gs-wrapper'>
                            <Col md={12} lg={9}>
                                <h1 id='page-title' tabIndex={-1} className='banner-title mb-4'>Services we offer</h1>
                                {/* <HeaderIntroText>NMI offers a range of services, please choose your services below</HeaderIntroText> */}
                            </Col>
                        </Row>
                    </Container>
                </Container>
                {renderServicesSelector()}
            </div>
        </>
    );
};

export default ServicesWeOffer;
