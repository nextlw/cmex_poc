export interface InputAiProps {
  width?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  onButtonClick?: () => void;
  style?: React.CSSProperties;
  showAutoComplete: Boolean
  autoCompleteData?: Array<JSON>
  handleAutocompleteClick: (value: JSON) => void
  isAutocompleteLoading: Boolean
  onClickOutside: () => void
}
