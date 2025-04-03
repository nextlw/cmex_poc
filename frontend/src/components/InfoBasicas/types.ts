export interface InfoBasicasProps {
  ncm?: string;
  descricao?: string;
  isLoading?: boolean;
  onNcmSearch?: (ncm: string) => void;
  onMaskedSearch?: (
    ncm: string,
    maskType: "capitulo" | "posicao" | "subposicao" | "item_completo"
  ) => void;
}
