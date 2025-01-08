export interface Option {
  label: string;
  value: string;
}

export const Modelos: Option[] = [
  { label: "Nexcode-0.1", value: "Nexcode-0.1" },
  { label: "Gemini-1.5-pro", value: "Gemini-1.5-pro" },
  { label: "GPT-4", value: "GPT-4" },
  { label: "Llama-3.2", value: "Llama-3.2" },
];

export interface SelectProps {
  label: string;
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  handleParentChange: () => void;
  style?: React.CSSProperties;
}
