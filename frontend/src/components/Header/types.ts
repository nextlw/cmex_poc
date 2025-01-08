export interface HeaderProps {
  modeloSelecionado: string | null;
  aoMudarModelo: (valor: string | null) => void;
  selectedModel: string | null;
  onModelChange: (valor: string | null) => void;
}
