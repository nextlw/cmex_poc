export interface ICMSByState {
  [state: string]: string; // exemplo: { "SP": "18%", "RJ": "20%" }
}

export interface TaxRates {
  ipi: string;
  icms: ICMSByState;
  pis: string;
  cofins: string;
}

export interface Suggestion {
  ncm: string;
  description: string;
  attributes: string[];
  tax_rates: TaxRates;
  tipi_attributes: string[];
}

export interface ProductQuery {
  query: string;
}

export interface AutocompleteProps {
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  placeholder?: string;
}
