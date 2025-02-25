export interface ButtonProps {
  onClick: () => void;
  label?: string;
  type?: string; // ex: 'danger', etc
  size?: string; // opcional: ex: 'small', 'medium', etc
  isLoading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
} 