const finishLoading = () => setIsLoading(false);

useEffect(() => {
    const loadQuoteDetails = async () => {
        setIsLoading(true);
        finishLoading();
        await getQuotationDetails();
    };

    void loadQuoteDetails();
}, [id]);
