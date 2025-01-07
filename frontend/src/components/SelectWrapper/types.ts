export interface Option {
  value: string;
  label: string;
}

export interface SelectWrapperProps {
  label: string;
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  handleParentChange: () => void;
}
