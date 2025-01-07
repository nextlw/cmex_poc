export interface Estado {
  nome: string; // anteriormente 'uf'
  icms: number; // anteriormente 'aliquota' como string
}

export interface RegiaoICMS {
  nome: string;
  estados: Estado[];
}

export interface CardRegiaoProps {
  regiao: RegiaoICMS;
}

export interface PropriedadesTooltipImposto {
  ncm: string;
  attributes: string[];
  appliedRules: string[];
}
