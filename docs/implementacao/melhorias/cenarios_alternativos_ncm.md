# Implementação de Cenários Alternativos para NCM

## Índice

1. [Objetivo](#objetivo)
2. [Visão geral das alterações](#visão-geral-das-alterações)
3. [Modificações no Frontend](#modificações-no-frontend)
   - [Interfaces de tipo (TypeScript)](#interfaces-de-tipo-typescript)
   - [Componentes de exibição](#componentes-de-exibição)
4. [Modificações no Backend](#modificações-no-backend)
   - [Controller NCM](#controller-ncm)
   - [DeepResearch NCM](#deepresearch-ncm)
   - [Prompts para os modelos](#prompts-para-os-modelos)
5. [API FastAPI](#api-fastapi)
6. [Testes e validação](#testes-e-validação)

## Objetivo

Implementar a funcionalidade de análise e exibição de cenários alternativos para classificação NCM, considerando:

- Produtos com funcionalidade principal distinta
- Produtos com composição material diferente
- Cenários com alterações na alíquota tributária aplicável

## Visão geral das alterações

A funcionalidade de cenários alternativos deve permitir que o sistema forneça classificações NCM alternativas para um produto, dependendo de variações em suas características. O componente DeepResearchSidebar já está preparado para exibir essas alternativas, mas o backend não está enviando os dados necessários.

## Modificações no Frontend

### Interfaces de tipo (TypeScript)

#### Interface SugerirNCM (frontend/src/types/index.ts)

**Atual:**

```typescript
export interface SugerirNCM {
  /** Código NCM */
  ncm: string;
  /** Descrição do produto/mercadoria */
  descricao: string;
  /** Atributos gerais do produto */
  atributos: string[];
  /** Atributos específicos da TIPI */
  atributos_tipi: string[];
  /** Classificação tributária do produto */
  classificacao_tributaria: ClassificacaoTributaria;
  /** Valores de impostos aplicáveis */
  valores_de_impostos: ValoresdeImpostos;
  /** Resultado da validação via DeepResearch, se disponível */
  validacao_deepresearch?: ValidationDeepResearch;
}
```

**Proposto:**

```typescript
export interface SugerirNCM {
  /** Código NCM */
  ncm: string;
  /** Descrição do produto/mercadoria */
  descricao: string;
  /** Atributos gerais do produto */
  atributos: string[];
  /** Atributos específicos da TIPI */
  atributos_tipi: string[];
  /** Classificação tributária do produto */
  classificacao_tributaria: ClassificacaoTributaria;
  /** Valores de impostos aplicáveis */
  valores_de_impostos: ValoresdeImpostos;
  /** Resultado da validação via DeepResearch, se disponível */
  validacao_deepresearch?: ValidationDeepResearch;
  /** Cenários alternativos de classificação */
  cenarios_alternativos?: CenarioAlternativo[];
}

/**
 * Estrutura para cenários alternativos de classificação NCM
 */
export interface CenarioAlternativo {
  /** Descrição do cenário alternativo */
  scenario: string;
  /** Impacto fiscal ou operacional do cenário */
  impact: string;
  /** Código NCM alternativo sugerido */
  suggestedNCM?: string;
  /** Descrição do NCM alternativo */
  description?: string;
  /** Valores de impostos para o cenário alternativo */
  taxes?: Partial<ValoresdeImpostos>;
}
```

### Componentes de exibição

#### DeepResearchSidebar (frontend/src/components/DeepResearchSidebar/index.tsx)

Este componente já possui a estrutura para exibir cenários alternativos. A implementação atual já inclui:

```typescript
// Interface para o relatório final
interface FinalReport {
  // ... outros campos
  alternativeCases: Array<{
    scenario: string;
    impact: string;
    suggestedNCM?: string;
  }>;
  // ... outros campos
}

// Renderização dos cenários alternativos
<div className="alternative-cases">
  <h3>Cenários Alternativos</h3>
  <div className="case-list">
    {finalReport.alternativeCases.map((altCase, index) => (
      <div key={index} className="case-item">
        <div className="case-header">
          {renderCaseIcon()}
          <h4>{altCase.scenario}</h4>
        </div>
        <div className="case-impact">{altCase.impact}</div>
        {altCase.suggestedNCM && (
          <div className="case-ncm">
            NCM Alternativo: {altCase.suggestedNCM}
          </div>
        )}
      </div>
    ))}
  </div>
</div>;
```

**Modificação proposta:**
Adicionar mapeamento entre dados da API e a interface do componente:

```typescript
// No componente que processa os dados recebidos da API:
const mapApiToFinalReport = (apiData) => {
  return {
    // ... outros mapeamentos
    alternativeCases:
      apiData.cenarios_alternativos?.map((cenario) => ({
        scenario: cenario.scenario,
        impact: cenario.impact,
        suggestedNCM: cenario.suggestedNCM,
      })) || [],
  };
};
```

## Modificações no Backend

### Controller NCM

#### Modificação em buscador_inteligente/src/controllers/ncm.ts

**Atual:**

```typescript
// Formatação do prompt para consulta de NCM
function format_prompt(consulta: ConsultaProduto): string {
  const {
    consulta: descricaoProduto,
    estadoOrigem = "Não informado",
    operacao = "Não informado",
    regimeTributario = "Não informado",
    tributacao = "Não informado",
  } = consulta;

  // Construção do prompt atual (sem menção a cenários alternativos)
  // ...
}
```

**Proposto:**

```typescript
// Formatação do prompt para consulta de NCM
function format_prompt(consulta: ConsultaProduto): string {
  const {
    consulta: descricaoProduto,
    estadoOrigem = "Não informado",
    operacao = "Não informado",
    regimeTributario = "Não informado",
    tributacao = "Não informado",
  } = consulta;

  // Construção do prompt atual
  // ...

  // Adicionar instruções para cenários alternativos
  const promptCompleto = `
    ${promptBase}
    
    Além da classificação principal, identifique pelo menos 2 cenários alternativos 
    que poderiam alterar a classificação NCM ou a tributação do produto. Por exemplo:
    
    1. Se o produto tiver funcionalidade principal distinta
    2. Se o produto apresentar composição material diferente
    3. Se o produto for destinado a outra finalidade
    4. Se houver variações específicas que mudam a classificação
    
    Para cada cenário alternativo, forneça:
    - Descrição clara do cenário
    - Código NCM alternativo (se aplicável)
    - Impacto tributário/fiscal resultante
    
    Estruture esta parte da resposta no campo "cenarios_alternativos" do JSON.
  `;

  return promptCompleto;
}
```

### DeepResearch NCM

#### Modificação em buscador_inteligente/src/controllers/deepResearchNCM.ts

**Atual:**

```typescript
// Não há implementação para processamento de cenários alternativos

// Processamento da resposta do DeepResearch
export async function processarDeepResearch(
  req: CustomRequest,
  res: Response
): Promise<void> {
  try {
    // Processamento atual
    // ...

    // Retorno da resposta sem cenários alternativos
    res.status(200).json({
      ...resultadoProcessado,
      validacao_deepresearch: {
        status: "verified",
        confianca: confianca,
        observacoes: observacoes,
      },
    });
  } catch (error) {
    // Tratamento de erro
    // ...
  }
}
```

**Proposto:**

```typescript
// Adicionar processamento de cenários alternativos

// Processamento da resposta do DeepResearch
export async function processarDeepResearch(
  req: CustomRequest,
  res: Response
): Promise<void> {
  try {
    // Processamento atual
    // ...

    // Analisar cenários alternativos
    const cenariosAlternativos = await analisarCenariosAlternativos(consulta);

    // Retorno da resposta com cenários alternativos
    res.status(200).json({
      ...resultadoProcessado,
      validacao_deepresearch: {
        status: "verified",
        confianca: confianca,
        observacoes: observacoes,
      },
      cenarios_alternativos: cenariosAlternativos,
    });
  } catch (error) {
    // Tratamento de erro
    // ...
  }
}

// Função para analisar cenários alternativos
async function analisarCenariosAlternativos(
  consulta: ConsultaProduto
): Promise<any[]> {
  try {
    // Se já temos cenários alternativas da FastAPI, usamos eles
    if (
      req.fastApiResult?.cenarios_alternativos &&
      req.fastApiResult.cenarios_alternativos.length > 0
    ) {
      return req.fastApiResult.cenarios_alternativos;
    }

    // Caso contrário, geramos usando o modelo escolhido
    const modeloPrompt = `
      Analise o produto: "${consulta.consulta}"
      
      Identifique cenários alternativos onde a classificação fiscal poderia ser diferente.
      Considere:
      1. Funcionalidade principal distinta
      2. Composição material diferente
      3. Alterações na alíquota tributária
      
      Para cada cenário, forneça:
      - Descrição do cenário
      - Código NCM alternativo
      - Impacto fiscal
    `;

    // Chamar modelo de IA usando a função apropriada para o modelo selecionado
    const funcaoEscolhida =
      funcoes_modelos[consulta.modelo] || obterSugestoesGPT4;
    const resultado = await funcaoEscolhida({
      ...consulta,
      consulta: modeloPrompt,
    });

    // Extrair e formatar os cenários alternativos da resposta
    // Implementação depende do formato de resposta do modelo
    const cenarios = formatarCenariosAlternativos(resultado);

    return cenarios;
  } catch (error) {
    console.error("Erro ao processar cenários alternativos:", error);
    // Retornar array vazio em caso de erro para não bloquear o fluxo principal
    return [];
  }
}

// Formatar cenários alternativos da resposta do modelo
function formatarCenariosAlternativos(resposta: any): any[] {
  try {
    // Implementação específica para extrair cenários da resposta
    // ...
    return cenarios.map((c) => ({
      scenario: c.descricao || c.scenario,
      impact: c.impacto || c.impact,
      suggestedNCM: c.ncm_alternativo || c.suggestedNCM,
      description: c.descricao_ncm || c.description,
    }));
  } catch (error) {
    console.error("Erro ao formatar cenários alternativos:", error);
    return [];
  }
}
```

### Prompts para os modelos

**Atual:**
Os prompts atuais não solicitam explicitamente cenários alternativos.

**Proposto:**
Adicionar instruções específicas nos prompts para todos os modelos:

```typescript
// Exemplo de adição no prompt para o GPT-4
const promptGPT4 = `
  ${promptBase}
  
  Após fornecer a classificação principal, identifique 2-3 cenários alternativos onde a classificação NCM poderia mudar.
  Para cada cenário alternativo, forneça:
  
  1. Descrição clara do cenário (ex: "Se o produto tiver funcionalidade de...")
  2. Código NCM alternativo aplicável
  3. Breve explicação do impacto fiscal/tributário
  
  Estruture esta parte da resposta como um array no campo "cenarios_alternativos" com os sub-campos:
  - "scenario": descrição do cenário
  - "impact": impacto fiscal/tributário
  - "suggestedNCM": código NCM alternativo
`;
```

## API FastAPI

### Modificação do schema de resposta

**Atual:**

```python
class NCMResponse(BaseModel):
    ncm: str
    descricao: str
    atributos: List[str]
    atributos_tipi: List[str]
    classificacao_tributaria: dict
    valores_de_impostos: dict
```

**Proposto:**

```python
class CenarioAlternativo(BaseModel):
    scenario: str
    impact: str
    suggestedNCM: Optional[str] = None
    description: Optional[str] = None
    taxes: Optional[dict] = None

class NCMResponse(BaseModel):
    ncm: str
    descricao: str
    atributos: List[str]
    atributos_tipi: List[str]
    classificacao_tributaria: dict
    valores_de_impostos: dict
    cenarios_alternativos: Optional[List[CenarioAlternativo]] = []
```

### Modificação do endpoint

**Atual:**

```python
@app.post("/consultas")
async def consultar_ncm(consulta: ConsultaRequest) -> NCMResponse:
    # Processamento atual
    # ...
    return NCMResponse(
        ncm=resultado["ncm"],
        descricao=resultado["descricao"],
        atributos=resultado["atributos"],
        atributos_tipi=resultado["atributos_tipi"],
        classificacao_tributaria=resultado["classificacao_tributaria"],
        valores_de_impostos=resultado["valores_de_impostos"]
    )
```

**Proposto:**

```python
@app.post("/consultas")
async def consultar_ncm(consulta: ConsultaRequest) -> NCMResponse:
    # Processamento atual
    # ...

    # Processar cenários alternativos
    cenarios_alternativos = processar_cenarios_alternativos(consulta, resultado)

    return NCMResponse(
        ncm=resultado["ncm"],
        descricao=resultado["descricao"],
        atributos=resultado["atributos"],
        atributos_tipi=resultado["atributos_tipi"],
        classificacao_tributaria=resultado["classificacao_tributaria"],
        valores_de_impostos=resultado["valores_de_impostos"],
        cenarios_alternativos=cenarios_alternativos
    )

def processar_cenarios_alternativos(consulta: ConsultaRequest, resultado_principal: dict) -> List[CenarioAlternativo]:
    # Implementação do processamento de cenários alternativos
    # Esta função pode usar o mesmo modelo de IA ou um específico para análise de cenários
    prompt = f"""
    Analise o produto: "{consulta.consulta}"

    A classificação principal é NCM {resultado_principal['ncm']}: {resultado_principal['descricao']}

    Identifique 2-3 cenários alternativos onde a classificação fiscal poderia mudar, considerando:
    1. Funcionalidade principal distinta
    2. Composição material diferente
    3. Variações que afetam a tributação

    Para cada cenário, forneça:
    - Descrição detalhada do cenário
    - Código NCM alternativo
    - Impacto tributário/fiscal resultante
    """

    # Chamar o modelo de IA com o prompt
    # Processar a resposta e formatá-la

    return [
        CenarioAlternativo(
            scenario=scenario,
            impact=impact,
            suggestedNCM=ncm,
            description=description
        )
        for scenario, impact, ncm, description in cenarios
    ]
```

## Testes e validação

Para validar a implementação, serão necessários:

1. **Testes unitários**:

   - Verificar se as interfaces são compatíveis
   - Testar o mapeamento entre os dados da API e as interfaces do frontend
   - Validar a extração de cenários alternativos das respostas dos modelos

2. **Testes de integração**:

   - Verificar se os cenários alternativos estão sendo corretamente transmitidos do backend para o frontend
   - Testar com diferentes modelos de IA e verificar consistência dos resultados

3. **Casos de teste**:

   - Produtos com múltiplas possibilidades claras de classificação
   - Produtos na fronteira entre capítulos NCM
   - Produtos com composição mista
   - Produtos cuja finalidade pode alterar significativamente a classificação

4. **Critérios de aceitação**:
   - Sistema deve gerar pelo menos 2 cenários alternativos por consulta
   - Cenários alternativos devem ser relevantes para o produto consultado
   - As alternativas devem incluir alterações baseadas nos 3 critérios: funcionalidade, composição e tributação
   - A interface deve exibir claramente as alternativas com seus respectivos impactos
