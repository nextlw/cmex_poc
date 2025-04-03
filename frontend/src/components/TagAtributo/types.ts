import { AtributoNCM } from "../../types/atributos";

export interface TagAtributoProps {
  attribute: AtributoNCM;
  onRemove?: (codigo: string) => void;
}
