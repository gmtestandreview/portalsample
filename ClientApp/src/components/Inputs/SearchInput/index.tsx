import TextInput, { type TextInputProps } from '../TextInput';

export type SearchInputProps = Omit<TextInputProps, 'type'>;

const SearchInput = (props: Readonly<SearchInputProps>) => (
  <TextInput {...props} type='search' />
);

export default SearchInput;
