export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  queryName: string;
  queryId: string | number;
  onCancel: () => void;
  onConfirm: () => void;
} 