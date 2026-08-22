useEffect(() => {
    const onResize = () => {
        window.setTimeout(updateVisiblePageRange, 500);
    };

    window.addEventListener('resize', onResize);
}, []);
