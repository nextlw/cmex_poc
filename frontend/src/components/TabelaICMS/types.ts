export interface Estado {
  nome: string;
  icms: number;
}

export interface RegiaoICMS {
  nome: string;
  estados: Estado[];
}
