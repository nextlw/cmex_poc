export interface ICMSByState {
  [state: string]: string;
}

export interface ValoresdeImpostos {
  ipi: string;
  icms: ICMSByState;
  pis: string;
  cofins: string;
}

export interface SugerirNCM {
  ncm: string;

  description: string;

  attributes: string[];

  tipi_attributes: string[];

  valores_de_impostos: ValoresdeImpostos;

  classificacao_tributaria?: {
    monofasico: boolean;

    aliquota_zero: boolean;

    ipi_entrada: string;

    ipi_saida: string;

    pis_entrada: string;

    pis_saida: string;

    cofins_entrada: string;

    cofins_saida: string;

    cst_entrada: string;

    cst_saida: string;
  };
}

export interface ProdutodaPesquisa {
  pesquisa: string;
}

/**
 * Propriedades do componente de preenchimento automático
 */
export interface PreenchimentoAutomaticoProps {
  onSuggestionSelect?: (sugerir: SugerirNCM) => void;
  placeholder?: string;
}

// Enums

/**
 * Representa o tipo de imposto
 */
export enum TipoImposto {
  IPI = "IPI",
  PIS = "PIS",
  COFINS = "COFINS",
  ICMS = "ICMS",
}

/**
 * Estado da verificação do sistema
 */
export enum EstadoVerificacao {
  VERIFIED = "VERIFIED",
  OUTDATED = "OUTDATED",
  PENDING = "PENDING",
}

// Types básicos

/**
 * Código do Estado.
 */
export type CodigoEstado = string;

/**
 * Taxas de imposto.
 */
export type TaxasImposto = string;

/**
 * Código NCM.
 */
export type CodigoNCM = string;

// Interface base para atributos

/**
 * Interface base para atributos.
 */
export interface AtributosBase {
  readonly name: string;
  readonly description?: string;
}

// Interfaces principais

/**
 * Regra de cálculo de imposto
 */
export interface RegraImposto {
  readonly condition: (attrs: string[]) => boolean;
  readonly rate: TaxasImposto;
  readonly description?: string;
}

/**
 * Conjunto de regras de impostos
 */
export interface ConjuntoRegrasImposto {
  readonly [ncmPrefix: string]: RegraImposto;
}

/**
 * Regras personalizadas de impostos
 */
export interface RegrasPersonalizadas {
  readonly [key: string]: RegraImposto;
}

/**
 * Informações da alíquota do ICMS
 */
export interface InformacoesAliquotaICMS {
  readonly state: CodigoEstado;
  readonly rate: TaxasImposto;
  readonly lastUpdate?: Date;
  readonly isVerified?: boolean;
  readonly source?: string;
}

/**
 * Propriedades do cartão de visualização de impostos
 */
export interface PropriedadesCartaoImposto {
  readonly label: string;
  value?: TaxasImposto; // Tornar opcional
  readonly className?: string;
  readonly ncm: CodigoNCM;
  readonly attributes?: readonly string[];
  readonly tipiAttributes?: readonly string[];
  readonly taxType: TipoImposto;
  readonly customRules?: RegrasPersonalizadas;
}

/**
 * Propriedades da tabela ICMS.
 */
export interface PropriedadesTabelaICMS {
  readonly icmsRates: Readonly<Record<CodigoEstado, TaxasImposto>>;
  readonly maxHeight?: string;
  readonly verificationConfig?: ConfiguracaoVerificacaoICMS;
  readonly ncm?: CodigoNCM;
}

/**
 * Configuração de verificação do ICMS.
 */
export interface ConfiguracaoVerificacaoICMS {
  readonly enabled: boolean;
  readonly apiUrl?: string;
  readonly updateInterval?: number;
  readonly verificationStrategy?: "real-time" | "cached" | "manual";
}

/**
 * Atributos do produto.
 */
export interface AtributosProduto extends AtributosBase {
  readonly category: string;
  readonly subCategory?: string;
  readonly isImported: boolean;
}

/**
 * Atributos TIPI.
 */
export interface AtributosTIPI extends AtributosBase {
  readonly code: string;
  readonly chapter: string;
  readonly section: string;
}

/**
 * Propriedades do cartão de produto.
 */
export interface PropriedadesCartaoProduto {
  readonly ncm: CodigoNCM;
  readonly description: string;
  readonly attributes: readonly AtributosProduto[];
  readonly tipiAttributes: readonly AtributosTIPI[];
  readonly onClick?: () => void;
}

/**
 * Sugestão de imposto.
 */
export interface SugestaoImposto {
  value: string;
  readonly ncm: CodigoNCM;
  readonly description: string;
  readonly attributes: readonly string[];
  readonly tipi_attributes: readonly string[];
  readonly tax_rates: {
    readonly ipi: TaxasImposto;
    readonly icms: Readonly<Record<CodigoEstado, TaxasImposto>>;
    readonly pis: TaxasImposto;
    readonly cofins: TaxasImposto;
  };
  readonly probability?: number;
  readonly source?: string;
}

/**
 * Estado da pesquisa.
 */
export interface EstadoPesquisa {
  readonly query: string;
  readonly isLoading: boolean;
  readonly suggestions: readonly SugestaoImposto[];
  readonly error?: string;
}

/**
 * Ações da pesquisa.
 */
export interface AcoesPesquisa {
  readonly setQuery: (query: string) => void;
  readonly setSuggestions: (suggestions: SugestaoImposto[]) => void;
  readonly setLoading: (isLoading: boolean) => void;
  readonly setError: (error: string) => void;
}

/**
 * Propriedades do componente de pesquisa.
 */
export interface PropriedadesPesquisa extends EstadoPesquisa, AcoesPesquisa {
  readonly onSearch: (query: string) => Promise<void>;
}

/**
 * Propriedades do contêiner de resultados.
 */
export interface PropriedadesContainerResultados {
  readonly suggestions: readonly SugestaoImposto[];
  readonly isLoading: boolean;
  readonly onSelect?: (suggestion: SugestaoImposto) => void;
}

/**
 * Propriedades do estado vazio.
 */
export interface PropriedadesEstadoVazio {
  readonly message?: string;
  readonly icon?: React.ReactNode;
}

/**
 * Propriedades do estado de carregamento.
 */
export interface PropriedadesEstadoCarregamento {
  readonly message?: string;
  readonly type?: "spinner" | "skeleton" | "progressive";
}

/**
 * Resultado da validação.
 */
export type ResultadoValidacao = {
  readonly isValid: boolean;
  readonly errors?: readonly string[];
};

/**
 * Resultado do cálculo de imposto.
 */
export type ResultadoCalculoImposto = {
  readonly value: TaxasImposto;
  readonly isZero: boolean;
  readonly appliedRules: readonly string[];
  readonly metadata?: Record<string, unknown>;
};

/**
 * Propriedades do formulário de pesquisa.
 */
export interface PropriedadesFormularioPesquisa {
  title?: string;
}

/**
 * Conjunto de regras de imposto.
 */
export interface ConjuntoRegrasPersonalizadas {
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

/**
 * Propriedades do cartão de resultado de pesquisa.
 */
export interface PropriedadesCartaoResultadoPesquisa {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Propriedades da grade de impostos.
 */
export interface PropriedadesGradeImpostos {
  taxRates: {
    ipi: string;
    icms: Record<string, string>;
    pis: string;
    cofins: string;
  };
}

/**
 * Propriedades do cabeçalho de pesquisa.
 */
export interface PropriedadesCabecalhoPesquisa {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

/**
 * Propriedades do campo de input de feedback.
 */
export interface PropriedadesInputFeedback {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Propriedades do tooltip de imposto.
 */
export interface PropriedadesTooltipImposto {
  ncm: string;
  attributes: string[];
  appliedRules: string[];
}

export interface EstadoICMS {
  nome: string;
  icms: string;
}

export interface RegiaoICMS {
  nome: string;
  estados: EstadoICMS[];
}

export interface ClassificacaoTributaria {
  monofasico: boolean;
  aliquota_zero: boolean;
  ipi_entrada: string;
  ipi_saida: string;
  pis_entrada: string;
  pis_saida: string;
  cofins_entrada: string;
  cofins_saida: string;
  cst_entrada: string;
  cst_saida: string;
}

export interface Sugestao {
  ncm: string;
  descricao: string;
  atributos: string[];
  aliquotas: {
    ipi: string;
    icms: Record<string, string>;
    pis: string;
    cofins: string;
  };
  classificacao_tributaria: ClassificacaoTributaria;
}
