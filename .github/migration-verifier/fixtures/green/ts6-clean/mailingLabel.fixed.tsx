const printAreaRef = useRef<HTMLDivElement | null>(null);

const copyToClipboardClick = () => {
    const textToCopy = printAreaRef.current?.innerText ?? '';
    return navigator.clipboard.writeText(textToCopy);
};
