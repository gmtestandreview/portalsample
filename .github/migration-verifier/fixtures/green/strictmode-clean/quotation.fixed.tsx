useEffect(() => {
    const loadQuoteDetails = async () => {
        setIsLoading(true);
        try {
            await getQuotationDetails();
        } finally {
            setIsLoading(false);
        }
    };

    void loadQuoteDetails();
}, [accounts, id, instance]);

useEffect(() => {
    if (showInfo) {
        setDashboardInfoNotification({
            message: 'New initial reporting and/or ongoing reporting forms have been generated',
            severity: NotificationSeverity.Information,
        });
        return;
    }

    clearDashboardInfoNotification();
}, [showInfo]);
