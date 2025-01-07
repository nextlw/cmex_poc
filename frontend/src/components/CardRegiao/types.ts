export interface UF {
  nome: string;
  icms: number;
}

export interface RegiaoICMS {
  nome: string;
  estados: UF[];
}

export interface CardRegiaoProps {
  regiao: RegiaoICMS;
}
