export interface InputSearchProps {
    width?: string;
    height?: string;
    placeholder?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onBlur?: () => void;
    readOnly?: boolean;
    label?: string;
    icon?: React.ReactNode;
    showInnerLabel?: boolean;
    className?: string;
  }