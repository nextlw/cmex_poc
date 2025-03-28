# Plano de Implementação para Tratamento de JSON de LLMs no CMEX

## 1. Definição do Problema

O sistema atual não consegue gerenciar adequadamente os estados de loading durante a pesquisa de classificação fiscal, especialmente ao usar o DeepResearch. Quando um usuário realiza uma busca, todos os componentes exibem estado de loading simultaneamente (InputAI, skeletons, etc.) e não há uma transição fluida conforme os dados vão sendo disponibilizados pela LLM.

## 2. Requisitos

1. O InputAI deve permanecer em estado de loading até a conclusão completa da pesquisa
2. Os skeletons devem ser removidos gradualmente conforme os dados correspondentes forem validados
3. No DeepResearch, cada fase deve mostrar claramente seu estado (loading, erro, concluído)
4. A UI deve refletir com precisão o processamento em tempo real do backend
5. O sistema deve lidar com possíveis inconsistências no formato JSON gerado pela LLM

## 3. Schemas

### 3.1 Schema de Resposta Padronizado

```typescript
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
```

### 3.2 Tipos TypeScript para o Frontend

```typescript
// Tipos para o frontend em shared-types
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
  ncm: string;
  descricao: string;
  atributos: string[] | null;
  classificacao_tributaria: {
    ipi_entrada: string;
    ipi_saida: string;
    pis_entrada: string;
    pis_saida: string;
    cofins_entrada: string;
    cofins_saida: string;
    cst_entrada: string;
    cst_saida: string;
  } | null;
  valores_de_impostos: {
    ipi: string;
    pis: string;
    cofins: string;
    icms: Record<string, string>;
  } | null;
};

export type DeepResearchResponse = {
  step: number;
  completed: boolean;
  result: NCMResult[];
  validationStatus: ComponentValidationStatus;
};
```

## 4. Estratégia de Implementação

### 4.1 Normalização de Respostas JSON da LLM

1. **Criar biblioteca utilitária para normalização**:

```typescript
// frontend/src/utils/llm-json-normalizer.ts

import { z } from "zod";
import { ResponseSchema, DeepResearchResponse } from "shared-types";

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
```

### 4.2 Implementação no DeepResearchSidebar

```typescript
// Modificar o componente DeepResearchSidebar para usar o novo formato

useEffect(() => {
  if (!requestId) return;

  const fetchStatus = async () => {
    try {
      const response = await api.get(`/task-status/${requestId}`);

      // Normalizar a resposta para lidar com possíveis inconsistências no JSON da LLM
      const normalizedData = normalizeResponse(response.data);

      // Processar os dados normalizados
      const { step, completed, validationStatus } = normalizedData;

      // Atualizar os passos com base no status de validação
      updateStepsWithValidationStatus(step, validationStatus);

      // Atualizar os dados parciais se disponíveis
      if (normalizedData.result.length > 0) {
        updatePartialResults(normalizedData.result[0]);
      }

      // Verificar se o processamento foi concluído
      if (completed) {
        handleCompletedProcess(step, normalizedData);
      }
    } catch (error) {
      console.error("Erro ao processar requisição:", error);
      setHasError(true);
      setErrorMessage("Erro na conexão com o servidor");
    }
  };

  fetchStatus();
  const intervalId = window.setInterval(fetchStatus, 2000);

  return () => {
    window.clearInterval(intervalId);
  };
}, [requestId]);

// Função para atualizar os passos com base no status de validação
const updateStepsWithValidationStatus = (
  step: number,
  validationStatus: ComponentValidationStatus
) => {
  const updatedSteps = [...steps];

  // Atualizar o estado de cada passo baseado no status de validação
  updatedSteps.forEach((s, idx) => {
    if (idx < step) {
      // Passos anteriores são sempre completados
      s.status = "completed";
      s.minimized = true;
    } else if (idx === step) {
      // Passo atual está em processamento
      s.status = "processing";
      s.minimized = false;
    } else {
      // Passos futuros estão aguardando
      s.status = "waiting";
      s.minimized = true;
    }
  });

  setSteps(updatedSteps);
};
```

### 4.3 Implementação na HomePage

```typescript
// Modificar a HomePage para gerenciar diferentes estados de loading

// Adicionar estados granulares para cada componente
const [infoBasicasLoading, setInfoBasicasLoading] = useState(true);
const [atributosLoading, setAtributosLoading] = useState(true);
const [tributacaoLoading, setTributacaoLoading] = useState(true);

// Modificar a função de busca para usar os novos estados
const handleSearch = async () => {
  // Ativar todos os estados de loading
  setInputAiLoading(true);
  setInfoBasicasLoading(true);
  setAtributosLoading(true);
  setTributacaoLoading(true);

  try {
    const response = await axiosInstance.post("/queries", {
      consulta: pesquisa,
      modelo: selectedModel,
      useDeepResearch: useDeepResearch,
      ...dropdownSelection,
    });

    // Normalizar a resposta para lidar com possíveis inconsistências no JSON da LLM
    const normalizedData = normalizeResponse(response.data);

    // Atualizar os resultados
    setSugerirNCM(normalizedData.result);

    // Atualizar os estados de loading com base no status de validação
    const { validationStatus } = normalizedData;
    setInfoBasicasLoading(!validationStatus.infoBasicas.validated);
    setAtributosLoading(!validationStatus.atributos.validated);
    setTributacaoLoading(!validationStatus.tributacao.validated);

    // Se estamos usando DeepResearch, o InputAI permanece em loading até o fim
    if (!useDeepResearch || normalizedData.completed) {
      setInputAiLoading(false);
    }

    // Se o DeepResearch está ativo, monitore o progresso
    if (useDeepResearch) {
      setIsDeepResearchProcessing(true);
      setShowDeepResearchSidebar(true);

      // Extrair o requestId se disponível
      const requestId = normalizedData.requestId ||
                        normalizedData.result.find(item => item.requestId)?.requestId;

      if (requestId) {
        setDeepResearchRequestId(requestId);
      }
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);

    // Desativar todos os estados de loading em caso de erro
    setInputAiLoading(false);
    setInfoBasicasLoading(false);
    setAtributosLoading(false);
    setTributacaoLoading(false);
    setIsDeepResearchProcessing(false);
  }
};

// Na renderização, usar os estados granulares
// ...
<div className="page-item col-span-6 mobile-col-span-4 w-full">
  {infoBasicasLoading ? (
    <InfoBasicasSkeleton />
  ) : (
    <InfoBasicas
      ncm={sugerirNCM[0]?.ncm}
      descricao={sugerirNCM[0]?.descricao}
    />
  )}
</div>

<div className="page-item col-span-6 mobile-col-span-4 w-full">
  {atributosLoading ? (
    <AtributosSkeleton />
  ) : (
    <Atributos
      atributos={sugerirNCM[0]?.atributos || []}
      isLoading={false}
    />
  )}
</div>

<div className="col-span-12 box-page">
  {tributacaoLoading ? (
    <BoxdeImpostosSkeleton />
  ) : (
    <BoxdeImpostos
      classificacao={sugerirNCM[0]?.classificacao_tributaria}
    />
  )}
</div>
// ...
```

### 4.4 Modificações no Backend (LLM Prompt)

Para garantir que a LLM gere JSON no formato adequado, precisamos incluir instruções específicas no prompt:

```
Você DEVE retornar APENAS um JSON válido com a seguinte estrutura EXATA, sem comentários adicionais:

{
  "step": número (0-5 indicando o passo atual do processamento),
  "completed": booleano (true se o processamento estiver concluído),
  "result": [
    {
      "ncm": string (código NCM),
      "descricao": string (descrição do NCM),
      "atributos": array de strings ou null,
      "classificacao_tributaria": {
        "ipi_entrada": string,
        "ipi_saida": string,
        "pis_entrada": string,
        "pis_saida": string,
        "cofins_entrada": string,
        "cofins_saida": string,
        "cst_entrada": string,
        "cst_saida": string
      },
      "valores_de_impostos": {
        "ipi": string,
        "pis": string,
        "cofins": string,
        "icms": { <código-estado>: string, ... }
      }
    }
  ],
  "validationStatus": {
    "infoBasicas": {
      "validated": booleano,
      "loading": booleano
    },
    "atributos": {
      "validated": booleano,
      "loading": booleano
    },
    "tributacao": {
      "validated": booleano,
      "loading": booleano
    }
  }
}

Durante o processamento, preencha apenas os campos validados e defina os campos correspondentes como "validated": true. Mantenha os campos ainda não processados como null.

A cada etapa, atualize o campo "step" e o status de validação dos componentes correspondentes.
```

## 5. Monitoramento e Recuperação de Falhas

1. **Implementar monitoramento de falhas**:

   - Registrar erros de parse/normalização em sistema de logs
   - Criar métricas para monitorar a qualidade das respostas da LLM

2. **Estratégia de recuperação**:

   - Em caso de falha na normalização, usar dados parciais disponíveis
   - Estabelecer timeout para retry automático em caso de falta de resposta

## 6. Prompts para Implementação do Claude Sonnet 3.7

### 6.1 Prompt para Implementar a Biblioteca de Normalização

```
Preciso implementar uma biblioteca TypeScript para normalizar respostas JSON inconsistentes de LLMs. A biblioteca deve:

1. Usar Zod para validação e parsing
2. Lidar com diferentes formatos e nomes de campos
3. Aplicar valores default para campos ausentes
4. Seguir o schema definido em norma.md

Implemente o arquivo 'frontend/src/utils/llm-json-normalizer.ts' com todos os tipos, esquemas e funções necessárias para normalizar respostas JSON da LLM.
```

### 6.2 Prompt para Modificar DeepResearchSidebar

```
Preciso atualizar o componente DeepResearchSidebar para trabalhar com o novo formato de resposta da API e exibir corretamente os estados de loading.

Modifique o arquivo 'frontend/src/components/DeepResearchSidebar/index.tsx' para:

1. Usar a nova função normalizeResponse para padronizar as respostas da API
2. Atualizar os estados de loading de acordo com o validationStatus
3. Expandir automaticamente a fase atual (step) e minimizar as demais
4. Exibir o Spinner quando uma fase estiver em loading
5. Atualizar cada fase conforme os dados são validados pela LLM
```

### 6.3 Prompt para Modificar HomePage

```
Preciso atualizar a página HomePage para gerenciar estados de loading granulares para diferentes componentes da UI durante buscas.

Modifique o arquivo 'frontend/src/pages/HomePage/index.tsx' para:

1. Adicionar estados separados para cada seção (infoBasicas, atributos, tributacao)
2. Usar esses estados para controlar a exibição de skeletons
3. Manter o InputAI em loading até o término do processamento completo
4. Integrar com o DeepResearchSidebar para coordenar os estados
5. Tratar corretamente erros e estados intermediários
```

## 7. Guia de Testes

1. **Teste unitário da normalização**:

   - Testar com diferentes formatos de entrada
   - Verificar handling de campos ausentes ou mal formatados

2. **Teste de componente**:

   - Testar loading states (inicial, parcial, completo)
   - Verificar transições entre estados

3. **Teste end-to-end**:

   - Testar fluxo completo de pesquisa
   - Verificar comportamento com respostas reais da LLM

## 8. Considerações de Performance

1. **Otimizar parsing/normalização**:

   - Memoizar resultados para evitar processamento repetido
   - Usar tratamento assíncrono para não bloquear a UI

2. **Minimizar re-renders**:

   - Usar useMemo/useCallback para componentes que consomem os dados normalizados
   - Considerar Context API para compartilhar estados entre componentes
