import { z } from "zod";

// Definição dos tipos necessários
export interface ValidationStatus {
  validated: boolean;
  loading: boolean;
}

export interface ComponentValidationStatus {
  infoBasicas: ValidationStatus;
  atributos: ValidationStatus;
  tributacao: ValidationStatus;
}

export interface NCMResult {
  ncm?: string;
  descricao?: string;
  atributos: string[] | null;
  classificacao_tributaria: {
    ipi_entrada?: string;
    ipi_saida?: string;
    pis_entrada?: string;
    pis_saida?: string;
    cofins_entrada?: string;
    cofins_saida?: string;
    cst_entrada?: string;
    cst_saida?: string;
  } | null;
  valores_de_impostos: {
    ipi?: string;
    pis?: string;
    cofins?: string;
    icms: Record<string, string>;
  } | null;
}

export interface DeepResearchResponse {
  step: number;
  completed: boolean;
  result: NCMResult[];
  validationStatus: ComponentValidationStatus;
  requestId?: string;
}

// Schema de resposta principal
export const ResponseSchema = z.object({
  step: z.number().default(0),
  completed: z.boolean().default(false),
  result: z
    .array(
      z.object({
        ncm: z.string().optional(),
        descricao: z.string().optional(),
        atributos: z.array(z.string()).nullable().default(null),
        classificacao_tributaria: z
          .object({
            ipi_entrada: z.string().optional(),
            ipi_saida: z.string().optional(),
            pis_entrada: z.string().optional(),
            pis_saida: z.string().optional(),
            cofins_entrada: z.string().optional(),
            cofins_saida: z.string().optional(),
            cst_entrada: z.string().optional(),
            cst_saida: z.string().optional(),
          })
          .nullable()
          .default(null),
        valores_de_impostos: z
          .object({
            ipi: z.string().optional(),
            pis: z.string().optional(),
            cofins: z.string().optional(),
            icms: z.record(z.string()).default({}),
          })
          .nullable()
          .default(null),
      })
    )
    .default([]),
  validationStatus: z
    .object({
      infoBasicas: z.object({
        validated: z.boolean().default(false),
        loading: z.boolean().default(true),
      }),
      atributos: z.object({
        validated: z.boolean().default(false),
        loading: z.boolean().default(false),
      }),
      tributacao: z.object({
        validated: z.boolean().default(false),
        loading: z.boolean().default(false),
      }),
    })
    .default({
      infoBasicas: { validated: false, loading: true },
      atributos: { validated: false, loading: false },
      tributacao: { validated: false, loading: false },
    }),
  requestId: z.string().optional(),
});

// Mapeamento de campos para lidar com variações nos nomes
const fieldMappings = {
  // Mapeamento de campos de primeiro nível
  result: ["result", "results", "data", "items", "produtos"],
  validationStatus: [
    "validationStatus",
    "validation",
    "status",
    "componentStatus",
  ],
  step: ["step", "currentStep", "passo", "etapa"],
  completed: ["completed", "isCompleted", "concluido", "finalizado"],
  requestId: ["requestId", "id", "taskId", "processId"],

  // Mapeamento de campos de componentes
  infoBasicas: ["infoBasicas", "basicInfo", "informacoesBasicas", "info"],
  atributos: ["atributos", "attributes", "caracteristicas"],
  tributacao: [
    "tributacao",
    "taxation",
    "impostos",
    "classificacao_tributaria",
  ],

  // Mapeamento de estados
  validated: ["validated", "isValidated", "valid", "confirmado"],
  loading: ["loading", "isLoading", "carregando"],

  // Mapeamento de campos de resultado
  ncm: ["ncm", "codigo", "codigo_ncm", "codigoNCM"],
  descricao: ["descricao", "description", "desc", "nome"],
  classificacao_tributaria: [
    "classificacao_tributaria",
    "tributacao",
    "taxation",
    "impostos",
  ],
  valores_de_impostos: [
    "valores_de_impostos",
    "valores",
    "values",
    "aliquotas",
  ],
};

/**
 * Função auxiliar para encontrar um campo em um objeto usando diferentes nomes possíveis
 */
function findField(obj: any, fieldVariations: string[]): any {
  if (!obj || typeof obj !== "object") return undefined;

  for (const fieldName of fieldVariations) {
    if (fieldName in obj) {
      return obj[fieldName];
    }
  }
  return undefined;
}

/**
 * Normaliza uma resposta LLM para um formato padronizado
 */
export function normalizeResponse(llmResponse: any): DeepResearchResponse {
  try {
    // Primeira tentativa: validar diretamente com Zod
    return ResponseSchema.parse(llmResponse);
  } catch (error) {
    console.warn(
      "Resposta da LLM não está no formato esperado, tentando normalizar...",
      error
    );

    // Objeto normalizado base
    const normalized: DeepResearchResponse = {
      step: 0,
      completed: false,
      result: [],
      validationStatus: {
        infoBasicas: { validated: false, loading: true },
        atributos: { validated: false, loading: false },
        tributacao: { validated: false, loading: false },
      },
    };

    // Normalizar campos de primeiro nível
    normalized.step = findField(llmResponse, fieldMappings.step) || 0;
    normalized.completed =
      findField(llmResponse, fieldMappings.completed) || false;

    // Extrair o requestId se disponível
    const requestId = findField(llmResponse, fieldMappings.requestId);
    if (requestId) {
      normalized.requestId = requestId;
    }

    // Extrair o array de resultados
    const resultField = findField(llmResponse, fieldMappings.result);
    if (resultField) {
      const results = Array.isArray(resultField) ? resultField : [resultField];

      // Normalizar cada resultado individualmente
      normalized.result = results.map((item) => {
        const ncmResult: NCMResult = {
          ncm: findField(item, fieldMappings.ncm) || undefined,
          descricao: findField(item, fieldMappings.descricao) || undefined,
          atributos: null,
          classificacao_tributaria: null,
          valores_de_impostos: null,
        };

        // Processar atributos
        const atributos = findField(item, fieldMappings.atributos);
        if (atributos) {
          ncmResult.atributos = Array.isArray(atributos)
            ? atributos
            : [atributos];
        }

        // Processar classificação tributária
        const classificacaoTributaria = findField(
          item,
          fieldMappings.classificacao_tributaria
        );
        if (
          classificacaoTributaria &&
          typeof classificacaoTributaria === "object"
        ) {
          ncmResult.classificacao_tributaria = {
            ipi_entrada: classificacaoTributaria.ipi_entrada || "",
            ipi_saida: classificacaoTributaria.ipi_saida || "",
            pis_entrada: classificacaoTributaria.pis_entrada || "",
            pis_saida: classificacaoTributaria.pis_saida || "",
            cofins_entrada: classificacaoTributaria.cofins_entrada || "",
            cofins_saida: classificacaoTributaria.cofins_saida || "",
            cst_entrada: classificacaoTributaria.cst_entrada || "",
            cst_saida: classificacaoTributaria.cst_saida || "",
          };
        }

        // Processar valores de impostos
        const valoresImpostos = findField(
          item,
          fieldMappings.valores_de_impostos
        );
        if (valoresImpostos && typeof valoresImpostos === "object") {
          ncmResult.valores_de_impostos = {
            ipi: valoresImpostos.ipi || "",
            pis: valoresImpostos.pis || "",
            cofins: valoresImpostos.cofins || "",
            icms:
              typeof valoresImpostos.icms === "object"
                ? valoresImpostos.icms
                : {},
          };
        }

        return ncmResult;
      });
    }

    // Extrair o status de validação
    const validationObj = findField(
      llmResponse,
      fieldMappings.validationStatus
    );
    if (validationObj) {
      // Processar cada componente (infoBasicas, atributos, tributacao)
      const components = ["infoBasicas", "atributos", "tributacao"] as const;

      for (const component of components) {
        const componentVariations = fieldMappings[component];
        const componentObj = findField(
          validationObj,
          componentVariations as string[]
        );

        if (componentObj) {
          let isValidated = false;
          let isLoading = component === "infoBasicas"; // Por padrão, apenas infoBasicas começa em loading

          // Buscar o estado 'validated' entre as possíveis variações
          const validatedField = findField(
            componentObj,
            fieldMappings.validated as string[]
          );
          if (validatedField !== undefined) {
            isValidated = Boolean(validatedField);
          }

          // Buscar o estado 'loading' entre as possíveis variações
          const loadingField = findField(
            componentObj,
            fieldMappings.loading as string[]
          );
          if (loadingField !== undefined) {
            isLoading = Boolean(loadingField);
          }

          // Atualizar o objeto normalizado
          normalized.validationStatus[component] = {
            validated: isValidated,
            loading: isLoading,
          };
        }
      }
    }

    // Verificar se os componentes estão validados com base nos dados disponíveis
    if (normalized.result.length > 0) {
      const result = normalized.result[0];

      // Se temos NCM e descrição, infoBasicas pode ser considerado validado
      if (result.ncm && result.descricao) {
        normalized.validationStatus.infoBasicas.validated = true;
        normalized.validationStatus.infoBasicas.loading = false;
      }

      // Se temos atributos, este componente pode ser considerado validado
      if (result.atributos && result.atributos.length > 0) {
        normalized.validationStatus.atributos.validated = true;
        normalized.validationStatus.atributos.loading = false;
      }

      // Se temos classificação tributária ou valores de impostos, tributacao pode ser considerado validado
      if (result.classificacao_tributaria || result.valores_de_impostos) {
        normalized.validationStatus.tributacao.validated = true;
        normalized.validationStatus.tributacao.loading = false;
      }
    }

    // Validar e retornar o objeto normalizado
    try {
      return ResponseSchema.parse(normalized);
    } catch (parseError) {
      console.error("Erro ao normalizar resposta:", parseError);
      // Retorna o melhor esforço de normalização mesmo que não passe na validação completa
      return normalized;
    }
  }
}

/**
 * Função de utilidade que detecta se um JSON está malformado e tenta corrigi-lo
 * Útil para quando a LLM retorna um JSON parcialmente quebrado
 */
export function tryFixMalformedJson(jsonString: string): any {
  try {
    // Primeiro tenta fazer parse direto
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn("JSON malformado detectado, tentando corrigir...");

    // Tenta corrigir aspas inconsistentes
    let fixedJson = jsonString
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Corrige chaves sem aspas
      .replace(/:\s*'([^']*)'/g, ':"$1"'); // Substitui aspas simples por duplas em valores

    // Tenta adicionar aspas em valores não strings (exceto true, false, null, números)
    fixedJson = fixedJson
      .replace(/:(?!\s*["{\[0-9.tfn-])/g, ':"')
      .replace(/([^"{\[0-9.tfn-\s])(?=\s*[,}])/g, '$1"');

    try {
      return JSON.parse(fixedJson);
    } catch (e2) {
      console.error("Não foi possível corrigir o JSON malformado:", e2);
      throw new Error("JSON malformado não pôde ser corrigido");
    }
  }
}
