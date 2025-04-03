import { AtributoNCM } from "../../types/atributos";

export interface AtributosProps {
  atributos?: string[] | AtributoNCM[] | null;
  isLoading?: boolean;
}
