import { useEffect } from 'react';

const addBodyClass = (className: string) => document.body.classList.add(className);
const removeBodyClass = (className: string) => document.body.classList.remove(className);

const useBodyClass = (className: string | string[]) => {
    useEffect(() => {
        const classNames = Array.isArray(className) ? className : [className];

        classNames.forEach(addBodyClass);

        return () => {
            classNames.forEach(removeBodyClass);
        };
    }, [className]);
};

export default useBodyClass;
