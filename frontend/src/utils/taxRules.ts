import { TaxType, NCMCode, TaxRule } from "../types/search";

export const NCM_CHAPTERS = {
  VEHICLES: "87",
  BEVERAGES: "22",
  ELECTRONICS: "85",
  // ... outros capítulos
} as const;

export const IPI_RULES: Record<string, TaxRule> = {
  [NCM_CHAPTERS.VEHICLES]: {
    condition: (attrs) => attrs.includes("IMPORTADO"),
    rate: "25%",
    description: "Veículos importados",
  },
  [NCM_CHAPTERS.BEVERAGES]: {
    condition: () => true,
    rate: "45%",
    description: "Bebidas alcoólicas",
  },
  // ... outras regras
};

export const ICMS_DEFAULT_RATES: Record<string, string> = {
  SP: "18%",
  RJ: "20%",
  MG: "18%",
  // ... outros estados
};

export const calculateTaxRate = (
  ncm: NCMCode,
  taxType: TaxType,
  attributes: string[],
  tipiAttributes: string[]
): string => {
  const chapter = ncm.substring(0, 2);

  switch (taxType) {
    case TaxType.IPI:
      // Verifica alíquota zero
      if (tipiAttributes.includes("ALIQUOTA_ZERO")) {
        return "0%";
      }
      // Verifica regras específicas
      const ipiRule = IPI_RULES[chapter];
      if (ipiRule && ipiRule.condition(attributes)) {
        return ipiRule.rate;
      }
      return "5%"; // Taxa padrão

    case TaxType.PIS:
      if (attributes.includes("MONOFASICO")) {
        return "0%";
      }
      return "1.65%";

    case TaxType.COFINS:
      if (attributes.includes("MONOFASICO")) {
        return "0%";
      }
      return "7.6%";

    default:
      return "0%";
  }
};

export const getTaxRateMetadata = (
  ncm: NCMCode,
  taxType: TaxType,
  attributes: string[]
): {
  baseRule: string;
  exceptions: string[];
  legalBase: string;
} => {
  // Implementar lógica para retornar metadata sobre o cálculo
  return {
    baseRule: "Regra geral",
    exceptions: [],
    legalBase: "Art. X da Lei Y",
  };
};
