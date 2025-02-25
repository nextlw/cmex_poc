import { SugerirNCM } from "../../types";

export interface AutocompleteType {
  id: string;
  id_usuario: string;
  id_produto: string | null;
  consulta: string;
  criado_em: string;
  avaliado_em: string | null;
  avaliacao: boolean | null;
  duracao_da_query: number;
  resultado: SugerirNCM[];
  comentarios: any | null;
  modelo: string;
  autocomplete: boolean;
}

export interface InputAiProps {
  width?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  onButtonClick?: () => void;
  style?: React.CSSProperties;
  showAutoComplete: Boolean
  autoCompleteData?: Array<AutocompleteType>
  handleAutocompleteClick: (value: AutocompleteType) => void
  isAutocompleteLoading: Boolean
  onClickOutside: () => void
}
