useEffect(() => {
    const loadDataForDisplay = async () => {
        setIsLoading(true);
        setIsLoading(false);
        setReload(false);
    };

    setIsLoading(true);
    loadDataForDisplay();
    setIsLoading(false);
}, [reload]);
