export interface DropdownMenuProps {
  onSelectionChange: (selection: SelectionData) => void;
}

export interface Option {
  label: string;
  value: string;
}

export interface SelectionData {
  estadoOrigem: string | null;
  operacao: string | null;
  regimeTributario: string | null;
  tributacao?: string | null;
  reducaoOuIsencao: string | null;
}

export interface DropdownOption {
  label: string;
  value: string;
}

export const stateOptions: DropdownOption[] = [
  { label: "AC", value: "AC" },
  { label: "AL", value: "AL" },
  { label: "AP", value: "AP" },
  { label: "AM", value: "AM" },
  { label: "BA", value: "BA" },
  { label: "CE", value: "CE" },
  { label: "DF", value: "DF" },
  { label: "ES", value: "ES" },
  { label: "GO", value: "GO" },
  { label: "MA", value: "MA" },
  { label: "MT", value: "MT" },
  { label: "MS", value: "MS" },
  { label: "MG", value: "MG" },
  { label: "PA", value: "PA" },
  { label: "PB", value: "PB" },
  { label: "PR", value: "PR" },
  { label: "PE", value: "PE" },
  { label: "PI", value: "PI" },
  { label: "RJ", value: "RJ" },
  { label: "RN", value: "RN" },
  { label: "RS", value: "RS" },
  { label: "RO", value: "RO" },
  { label: "RR", value: "RR" },
  { label: "SC", value: "SC" },
  { label: "SP", value: "SP" },
  { label: "SE", value: "SE" },
  { label: "TO", value: "TO" },
];

export const operationOptions: DropdownOption[] = [
  { label: "Consumo final", value: "Consumo final" },
  { label: "Revenda", value: "Revenda" },
  { label: "Industrialização", value: "Industrialização" },
];

export const regimeOptions: DropdownOption[] = [
  {
    label: "MEI (Microempreendedor Individual)",
    value: "MEI (Microempreendedor Individual)",
  },
  { label: "Simples Nacional", value: "Simples Nacional" },
  { label: "Lucro Presumido", value: "Lucro Presumido" },
  { label: "Lucro Real", value: "Lucro Real" },
];

export const taxationOptions: DropdownOption[] = [
  { label: "Monofásica", value: "Monofásica" },
  { label: "Substituição tributária", value: "Substituição tributária" },
  { label: "Nenhuma", value: "Nenhuma" },
];

export const reductionOptions: DropdownOption[] = [
  { label: "Isenção parcial", value: "Isenção parcial" },
  { label: "Isenção total", value: "Isenção total" },
  { label: "Sem isenção", value: "Sem isenção" },
];
