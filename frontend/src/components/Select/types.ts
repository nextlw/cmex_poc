export interface Option {
  label: string;
  value: string;
}

export const Modelos: Option[] = [
  { label: "Nex-0.2-Beta", value: "qwen2.5-7b-instruct-1m" },
  { label: "Gemini-2.0-flash", value: "Gemini-2.0-flash" },
  { label: "Nex-0.5-Preview-2025", value: "Nex-0.5-Preview-2025" },
  { label: "Nex-0.3-Preview-2024", value: "Nex-0.3-Preview-2024" },
  { label: "Nexcode-0.1-BETA", value: "Nexcode-0.1-BETA" },
  { label: "Nex-0.1-Pro-2024", value: "Nex-0.1-Pro-2024" },
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
