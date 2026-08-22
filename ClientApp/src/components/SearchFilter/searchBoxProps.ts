export interface SearchBoxProps {
    containerClassName?: string;
    className?: string;
    onSearchSubmit: (searchValue?: string) => void;
    initialSearchValue?: string;
    placeholder?: string;
}
