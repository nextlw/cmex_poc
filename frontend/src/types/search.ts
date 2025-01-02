// Enums
export enum TaxType {
  IPI = "IPI",
  PIS = "PIS",
  COFINS = "COFINS",
  ICMS = "ICMS", // Adicionado ICMS
}

export enum VerificationStatus {
  VERIFIED = "VERIFIED",
  OUTDATED = "OUTDATED",
  PENDING = "PENDING",
}

// Types básicos
export type StateCode = string;
export type TaxRates = string;
export type NCMCode = string;

// Interface base para atributos
export interface BaseAttributes {
  readonly name: string;
  readonly description?: string;
}

// Interfaces principais
export interface TaxRule {
  readonly condition: (attrs: string[]) => boolean;
  readonly rate: TaxRates;
  readonly description?: string;
}

export interface TaxRules {
  readonly [ncmPrefix: string]: TaxRule;
}

export interface CustomRules {
  readonly [key: string]: TaxRule;
}

export interface ICMSRateInfo {
  readonly state: StateCode;
  readonly rate: TaxRates;
  readonly lastUpdate?: Date;
  readonly isVerified?: boolean;
  readonly source?: string;
}

export interface TaxCardProps {
  readonly label: string;
  value?: TaxRates; // Tornar opcional
  readonly className?: string;
  readonly ncm: NCMCode;
  readonly attributes?: readonly string[];
  readonly tipiAttributes?: readonly string[];
  readonly taxType: TaxType;
  readonly customRules?: CustomRules;
}

export interface ICMSTableProps {
  readonly icmsRates: Readonly<Record<StateCode, TaxRates>>;
  readonly maxHeight?: string;
  readonly verificationConfig?: ICMSVerificationConfig;
  readonly ncm?: NCMCode;
}

export interface ICMSVerificationConfig {
  readonly enabled: boolean;
  readonly apiUrl?: string;
  readonly updateInterval?: number;
  readonly verificationStrategy?: "real-time" | "cached" | "manual";
}

export interface ProductAttributes extends BaseAttributes {
  readonly category: string;
  readonly subCategory?: string;
  readonly isImported: boolean;
}

export interface TIPIAttributes extends BaseAttributes {
  readonly code: string;
  readonly chapter: string;
  readonly section: string;
}

export interface ProductCardProps {
  readonly ncm: NCMCode;
  readonly description: string;
  readonly attributes: readonly ProductAttributes[];
  readonly tipiAttributes: readonly TIPIAttributes[];
  readonly onClick?: () => void;
}

export interface TaxSuggestion {
  value: string;
  readonly ncm: NCMCode;
  readonly description: string;
  readonly attributes: readonly string[];
  readonly tipi_attributes: readonly string[];
  readonly tax_rates: {
    readonly ipi: TaxRates;
    readonly icms: Readonly<Record<StateCode, TaxRates>>;
    readonly pis: TaxRates;
    readonly cofins: TaxRates;
  };
  readonly probability?: number;
  readonly source?: string;
}

export interface SearchState {
  readonly query: string;
  readonly isLoading: boolean;
  readonly suggestions: readonly TaxSuggestion[];
  readonly error?: string;
}

export interface SearchActions {
  readonly setQuery: (query: string) => void;
  readonly setSuggestions: (suggestions: TaxSuggestion[]) => void;
  readonly setLoading: (isLoading: boolean) => void;
  readonly setError: (error: string) => void;
}

// Props de componentes
export interface SearchProps extends SearchState, SearchActions {
  readonly onSearch: (query: string) => Promise<void>;
}

export interface ResultsContainerProps {
  readonly suggestions: readonly TaxSuggestion[];
  readonly isLoading: boolean;
  readonly onSelect?: (suggestion: TaxSuggestion) => void;
}

export interface EmptyStateProps {
  readonly message?: string;
  readonly icon?: React.ReactNode;
}

export interface LoadingStateProps {
  readonly message?: string;
  readonly type?: "spinner" | "skeleton" | "progressive";
}

// Utils types
export type ValidationResult = {
  readonly isValid: boolean;
  readonly errors?: readonly string[];
};

export type TaxCalculationResult = {
  readonly value: TaxRates;
  readonly isZero: boolean;
  readonly appliedRules: readonly string[];
  readonly metadata?: Record<string, unknown>;
};

export interface SearchFormProps {
  title?: string;
}

export interface TaxRuleSet {
  defaultRate: string;
  specialRates: {
    [ncmPrefix: string]: {
      rate: string;
      conditions?: {
        attributes?: string[];
        tipiAttributes?: string[];
      };
    };
  };
}

export interface SearchResultCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export interface TaxGridProps {
  taxRates: {
    ipi: string;
    icms: Record<string, string>;
    pis: string;
    cofins: string;
  };
}

export interface SearchHeaderProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export interface FeedbackInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface TaxTooltipProps {
  ncm: string;
  attributes: string[];
  appliedRules: string[];
}
