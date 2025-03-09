# Teste E2E - Camisa Polo - Caso Base

## Data: 2025-03-07

### Configuração do Teste
- **Modelo Selecionado:** gemini-1.5-pro
- **Query:** "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."

### Resultado
- **NCM Esperado:** 6105.10.00
- **NCM Obtido:** 6105.10.00
- **Resultado:** ✅ Correto
- **Tempo de Processamento Total:** 13.56 segundos
- **Confiança:** 0.9

## Processo de Análise Profunda (Deep Research)

### Resumo
- **Total de Etapas:** 5
- **Etapas Concluídas com Sucesso:** 5
- **Tempo Total de Processamento:** 13.56 segundos
- **Total de Retentativas:** 0

### Detalhes das Etapas

#### Etapa 1: Identificação do código NCM

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 2.40 segundos

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
- **Tempo de Processamento:** 2.88 segundos

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
    "outras_caracteristicas": "Manga curta, com 3 botões frontais e logotipo bordado.  A descrição indica uma camisa tipo polo, de malha, feita de algodão. Estes detalhes são determinantes para classificá-la no NCM 61051000 - Camisas de malha, de algodão, para homens ou meninos."
  }
}
```

#### Etapa 3: Cálculo de tributação aplicável

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 1.65 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."

Detalhe a tributação aplicável a este produto (IPI, ICMS, PIS, COFINS).
```

**Resposta JSON:**
```json
{
  "taxation": {
    "ipi": 7,
    "icms": 17,
    "pis": 1.65,
    "cofins": 7.6,
    "import_tax": 0
  }
}
```

#### Etapa 4: Identificação de atributos específicos

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 1.89 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."

Identifique atributos específicos do produto que possam impactar sua classificação fiscal.
```

**Resposta JSON:**
```json
{
  "attributes": {
    "material": "algodão",
    "composicao": "100% algodão",
    "tipo": "camisa",
    "modelo": "polo",
    "genero": "masculina",
    "manga": "curta",
    "detalhes": "3 botões frontais",
    "acabamento": "logotipo bordado"
  }
}
```

#### Etapa 5: Conclusão e nível de confiança

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 4.73 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."

Forneça uma conclusão final sobre a classificação, incluindo recomendações e observações importantes.
```

**Resposta JSON:**
```json
{
  "conclusion": "A classificação mais provável para 'Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado' é **6105.10.00 - Camisas de malha, de algodão, para homens ou meninos**.  No entanto, é crucial verificar as Regras Gerais para Interpretação do Sistema Harmonizado (RGI) e as Notas Explicativas do Sistema Harmonizado (NESH) para confirmar a classificação e descartar outras possibilidades, como camisas tipo polo consideradas 'T-shirts' (Capítulo 6109), dependendo de características específicas do produto, como o tipo de gola e acabamento.  A análise da composição têxtil (100% algodão) e o formato da camisa (manga curta, botões) direcionam para o Capítulo 6105.",
  "confidence": 0.9
}
```

### Resultado Consolidado
```json
{
  "ncm_code": "6105.10.00",
  "description": "Camisas de malha, de algodão, para homens ou meninos",
  "attributes": {
    "material": "algodão",
    "tipo": "camisa",
    "uso": "Vestuário",
    "outras_caracteristicas": "Manga curta, com 3 botões frontais e logotipo bordado.  A descrição indica uma camisa tipo polo, de malha, feita de algodão. Estes detalhes são determinantes para classificá-la no NCM 61051000 - Camisas de malha, de algodão, para homens ou meninos.",
    "composicao": "100% algodão",
    "modelo": "polo",
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
    "import_tax": 0
  },
  "conclusion": "A classificação mais provável para 'Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado' é **6105.10.00 - Camisas de malha, de algodão, para homens ou meninos**.  No entanto, é crucial verificar as Regras Gerais para Interpretação do Sistema Harmonizado (RGI) e as Notas Explicativas do Sistema Harmonizado (NESH) para confirmar a classificação e descartar outras possibilidades, como camisas tipo polo consideradas 'T-shirts' (Capítulo 6109), dependendo de características específicas do produto, como o tipo de gola e acabamento.  A análise da composição têxtil (100% algodão) e o formato da camisa (manga curta, botões) direcionam para o Capítulo 6105.",
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
A classificação mais provável para 'Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado' é **6105.10.00 - Camisas de malha, de algodão, para homens ou meninos**.  No entanto, é crucial verificar as Regras Gerais para Interpretação do Sistema Harmonizado (RGI) e as Notas Explicativas do Sistema Harmonizado (NESH) para confirmar a classificação e descartar outras possibilidades, como camisas tipo polo consideradas 'T-shirts' (Capítulo 6109), dependendo de características específicas do produto, como o tipo de gola e acabamento.  A análise da composição têxtil (100% algodão) e o formato da camisa (manga curta, botões) direcionam para o Capítulo 6105.

### Observações
- Tempo de resposta total: 13.56 segundos
- Taxa de confiança: 0.9
- Nenhum erro encontrado durante o processamento
