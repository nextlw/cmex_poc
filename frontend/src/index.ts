export interface Suggestion {
  ncm: string;
  description: string;
  attributes?: string[];
}

export interface ProductQuery {
  query: string;
}

export interface AutocompleteProps {
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  placeholder?: string;
}
