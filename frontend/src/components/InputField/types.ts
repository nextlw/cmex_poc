export interface InputFieldProps {
  width?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  label?: string;
  icon?: React.ReactNode;
  showInnerLabel?: boolean;
}
