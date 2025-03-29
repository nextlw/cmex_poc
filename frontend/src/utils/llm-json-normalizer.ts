import { z } from "zod";

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
});

// Tipos TypeScript para o frontend
export type ValidationStatus = {
  validated: boolean;
  loading: boolean;
};

export type ComponentValidationStatus = {
  infoBasicas: ValidationStatus;
  atributos: ValidationStatus;
  tributacao: ValidationStatus;
};

export type NCMResult = {
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
};

export type DeepResearchResponse = {
  step: number;
  completed: boolean;
  result: NCMResult[];
  validationStatus: ComponentValidationStatus;
  requestId?: string;
};

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
};

/**
 * Normaliza uma resposta LLM para um formato padronizado
 */
export function normalizeResponse(llmResponse: any): DeepResearchResponse {
  try {
    // Primeira tentativa: validar diretamente com Zod
    return ResponseSchema.parse(llmResponse);
  } catch (error) {
    console.warn(
      "Resposta da LLM não está no formato esperado, tentando normalizar..."
    );

    // Objeto normalizado base
    const normalized: DeepResearchResponse = {
      step: llmResponse.step || llmResponse.currentStep || 0,
      completed: llmResponse.completed || llmResponse.isCompleted || false,
      result: [],
      validationStatus: {
        infoBasicas: { validated: false, loading: true },
        atributos: { validated: false, loading: false },
        tributacao: { validated: false, loading: false },
      },
    };

    // Extrair o array de resultados, buscando por diferentes possíveis nomes
    for (const possibleField of fieldMappings.result) {
      if (llmResponse[possibleField]) {
        normalized.result = Array.isArray(llmResponse[possibleField])
          ? llmResponse[possibleField]
          : [llmResponse[possibleField]];
        break;
      }
    }

    // Extrair o status de validação
    let validationObj = null;
    for (const possibleField of fieldMappings.validationStatus) {
      if (llmResponse[possibleField]) {
        validationObj = llmResponse[possibleField];
        break;
      }
    }

    // Se encontrou o objeto de validação, normalizar seus campos
    if (validationObj) {
      // Processar cada componente (infoBasicas, atributos, tributacao)
      for (const stdComponent of ["infoBasicas", "atributos", "tributacao"]) {
        const componentVariations =
          fieldMappings[stdComponent as keyof typeof fieldMappings];

        // Buscar o componente entre as possíveis variações
        let componentObj = null;
        for (const variation of componentVariations as string[]) {
          if (validationObj[variation]) {
            componentObj = validationObj[variation];
            break;
          }
        }

        // Se encontrou o objeto do componente, extrair os estados
        if (componentObj) {
          let isValidated = false;
          let isLoading = true;

          // Buscar o estado 'validated' entre as possíveis variações
          for (const validatedVar of fieldMappings.validated as string[]) {
            if (typeof componentObj[validatedVar] !== "undefined") {
              isValidated = Boolean(componentObj[validatedVar]);
              break;
            }
          }

          // Buscar o estado 'loading' entre as possíveis variações
          for (const loadingVar of fieldMappings.loading as string[]) {
            if (typeof componentObj[loadingVar] !== "undefined") {
              isLoading = Boolean(componentObj[loadingVar]);
              break;
            }
          }

          // Atualizar o objeto normalizado
          normalized.validationStatus[
            stdComponent as keyof typeof normalized.validationStatus
          ] = {
            validated: isValidated,
            loading: isLoading,
          };
        }
      }
    }

    // Validar e retornar o objeto normalizado
    try {
      return ResponseSchema.parse(normalized);
    } catch (parseError) {
      console.error("Erro ao normalizar resposta:", parseError);
      return normalized; // Retorna o melhor esforço de normalização
    }
  }
}
