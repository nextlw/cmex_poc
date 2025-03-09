# Teste E2E - Camisa Polo - Caso Base

## Data: 2025-03-07

### Configuração do Teste
- **Modelo Selecionado:** gemini-1.5-pro
- **Query:** "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."

### Resultado
- **NCM Esperado:** 6105.10.00
- **NCM Obtido:** 6105.10.00
- **Resultado:** ✅ Correto
- **Tempo de Processamento Total:** 12.21 segundos
- **Confiança:** 0.9

## Processo de Análise Profunda (Deep Research)

### Resumo
- **Total de Etapas:** 5
- **Etapas Concluídas com Sucesso:** 5
- **Tempo Total de Processamento:** 12.21 segundos

### Detalhes das Etapas

#### Etapa 1: Identificação do código NCM

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 2.46 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."

Identifique o código NCM mais apropriado para este produto. Forneça o código e uma breve justificativa.
```

**Resposta JSON:**
```json
{
  "ncm_code": "6105.10.00",
  "description": "Camisas de malha, de algodão, para homens ou meninos"
}
```

#### Etapa 2: Análise de características do produto

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 2.74 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."

Descreva detalhadamente as características do produto que justificam sua classificação no NCM identificado.
```

**Resposta JSON:**
```json
{
  "ncm": "61051000",
  "attributes": {
    "material": "100% algodão",
    "tipo": "Camisa polo masculina",
    "uso": "Vestuário",
    "outras_caracteristicas": "Manga curta, com 3 botões frontais e logotipo bordado.  A descrição indica uma camisa tipo polo, de malha, feita de algodão. Estes detalhes são determinantes para a classificação 61051000 que abrange especificamente camisas polo de algodão para homens ou meninos."
  }
}
```

#### Etapa 3: Cálculo de tributação aplicável

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 1.94 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."

Detalhe a tributação aplicável a este produto (IPI, ICMS, PIS, COFINS).
```

**Resposta JSON:**
```json
{
  "ncm": "61051000",
  "taxation": {
    "ipi": 7,
    "icms": 17,
    "pis": 1.65,
    "cofins": 7.6,
    "import_tax": 35
  }
}
```

#### Etapa 4: Identificação de atributos específicos

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 1.64 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."

Identifique atributos específicos do produto que possam impactar sua classificação fiscal.
```

**Resposta JSON:**
```json
{
  "attributes": {
    "material": "100% algodão",
    "tipo": "camisa polo",
    "genero": "masculina",
    "manga": "curta",
    "detalhes": "3 botões frontais",
    "acabamento": "logotipo bordado"
  }
}
```

#### Etapa 5: Conclusão e nível de confiança

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 3.42 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."

Forneça uma conclusão final sobre a classificação, incluindo recomendações e observações importantes.
```

**Resposta JSON:**
```json
{
  "conclusion": "A classificação mais provável para 'Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado' é **6105.10.00 - Camisas de malha, de algodão, para homens ou meninos**.  É crucial verificar as Regras Gerais Interpretativas (RGI) e as Notas Explicativas do Sistema Harmonizado (NESH) para confirmar a classificação e garantir que todos os critérios sejam atendidos. A presença do logotipo bordado não altera a classificação, desde que não seja de metais preciosos ou revestido com eles.",
  "confidence": 0.9
}
```

### Resultado Consolidado
```json
{
  "ncm_code": "6105.10.00",
  "description": "Camisas de malha, de algodão, para homens ou meninos",
  "attributes": {
    "material": "100% algodão",
    "tipo": "camisa polo",
    "uso": "Vestuário",
    "outras_caracteristicas": "Manga curta, com 3 botões frontais e logotipo bordado.  A descrição indica uma camisa tipo polo, de malha, feita de algodão. Estes detalhes são determinantes para a classificação 61051000 que abrange especificamente camisas polo de algodão para homens ou meninos.",
    "genero": "masculina",
    "manga": "curta",
    "detalhes": "3 botões frontais",
    "acabamento": "logotipo bordado"
  },
  "taxation": {
    "ipi": 7,
    "icms": 17,
    "pis": 1.65,
    "cofins": 7.6,
    "import_tax": 35
  },
  "conclusion": "A classificação mais provável para 'Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado' é **6105.10.00 - Camisas de malha, de algodão, para homens ou meninos**.  É crucial verificar as Regras Gerais Interpretativas (RGI) e as Notas Explicativas do Sistema Harmonizado (NESH) para confirmar a classificação e garantir que todos os critérios sejam atendidos. A presença do logotipo bordado não altera a classificação, desde que não seja de metais preciosos ou revestido com eles.",
  "confidence": 0.9,
  "model_used": "gemini-1.5-pro",
  "processing_time": 0
}
```

### Análise de Tokens
```json
{}
```

### Conclusão
O modelo gemini-1.5-pro classificou corretamente o produto no código NCM esperado. 

Conclusão do modelo:
A classificação mais provável para 'Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado' é **6105.10.00 - Camisas de malha, de algodão, para homens ou meninos**.  É crucial verificar as Regras Gerais Interpretativas (RGI) e as Notas Explicativas do Sistema Harmonizado (NESH) para confirmar a classificação e garantir que todos os critérios sejam atendidos. A presença do logotipo bordado não altera a classificação, desde que não seja de metais preciosos ou revestido com eles.

### Observações
- Tempo de resposta total: 12.21 segundos
- Taxa de confiança: 0.9
- Nenhum erro encontrado durante o processamento
