# Teste E2E - Camisa Polo - Caso com Detalhes Específicos

## Data: 2025-03-07

### Configuração do Teste
- **Modelo Selecionado:** gemini-1.5-pro
- **Query:** "Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta."

### Resultado
- **NCM Esperado:** 6105.10.00
- **NCM Obtido:** 6105.10.00
- **Resultado:** ✅ Correto
- **Tempo de Processamento Total:** 22.41 segundos
- **Confiança:** 0.95

## Processo de Análise Profunda (Deep Research)

### Resumo
- **Total de Etapas:** 5
- **Etapas Concluídas com Sucesso:** 5
- **Tempo Total de Processamento:** 22.41 segundos
- **Total de Retentativas:** 3

### Detalhes das Etapas

#### Etapa 1: Identificação do código NCM

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 2.35 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta."

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
- **Tempo de Processamento:** 3.01 segundos
- **Tentativas Realizadas:** 3

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta."

Descreva detalhadamente as características do produto que justificam sua classificação no NCM identificado.
```

**Resposta JSON:**
```json
{
  "attributes": {
    "material": "100% algodão",
    "tipo": "Camisa polo masculina",
    "uso": "Vestuário",
    "outras_caracteristicas": "Manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta, tecido piqué. Estes detalhes, embora auxiliem na especificação do produto, não alteram a classificação NCM geral para camisas de algodão."
  }
}
```

#### Etapa 3: Cálculo de tributação aplicável

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 1.97 segundos
- **Tentativas Realizadas:** 2

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta."

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
    "import_tax": 16
  }
}
```

#### Etapa 4: Identificação de atributos específicos

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 3.03 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta."

Identifique atributos específicos do produto que possam impactar sua classificação fiscal.
```

**Resposta JSON:**
```json
{
  "attributes": {
    "tipo_produto": "vestuário",
    "categoria_produto": "camisa",
    "modelo": "polo",
    "genero": "masculina",
    "material": "100% algodão",
    "tipo_tecido": "piqué",
    "comprimento_manga": "curta",
    "tipo_gola": "canelada com listras",
    "tipo_fechamento": "botões",
    "numero_botoes": "3",
    "material_botoes": "perola",
    "decoracao": "logotipo bordado",
    "local_decoracao": "peito",
    "detalhes": "fenda lateral, barra reta"
  }
}
```

#### Etapa 5: Conclusão e nível de confiança

- **Status:** ✅ Sucesso
- **Tempo de Processamento:** 3.42 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta."

Forneça uma conclusão final sobre a classificação, incluindo recomendações e observações importantes.
```

**Resposta JSON:**
```json
{
  "conclusion": "A classificação mais provável para 'Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta' é **6105.10.00 - Camisas de malha, de algodão, para homens ou meninos**.  A descrição detalhada do produto indica claramente que se trata de uma camisa de malha de algodão para homem. O tipo de gola, os botões, o logotipo e os detalhes de acabamento não alteram a classificação NCM principal.",
  "confidence": 0.95
}
```

### Resultado Consolidado
```json
{
  "ncm_code": "6105.10.00",
  "description": "Camisas de malha, de algodão, para homens ou meninos",
  "attributes": {
    "material": "100% algodão",
    "tipo": "Camisa polo masculina",
    "uso": "Vestuário",
    "outras_caracteristicas": "Manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta, tecido piqué. Estes detalhes, embora auxiliem na especificação do produto, não alteram a classificação NCM geral para camisas de algodão.",
    "tipo_produto": "vestuário",
    "categoria_produto": "camisa",
    "modelo": "polo",
    "genero": "masculina",
    "tipo_tecido": "piqué",
    "comprimento_manga": "curta",
    "tipo_gola": "canelada com listras",
    "tipo_fechamento": "botões",
    "numero_botoes": "3",
    "material_botoes": "perola",
    "decoracao": "logotipo bordado",
    "local_decoracao": "peito",
    "detalhes": "fenda lateral, barra reta"
  },
  "taxation": {
    "ipi": 7,
    "icms": 17,
    "pis": 1.65,
    "cofins": 7.6,
    "import_tax": 16
  },
  "conclusion": "A classificação mais provável para 'Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta' é **6105.10.00 - Camisas de malha, de algodão, para homens ou meninos**.  A descrição detalhada do produto indica claramente que se trata de uma camisa de malha de algodão para homem. O tipo de gola, os botões, o logotipo e os detalhes de acabamento não alteram a classificação NCM principal.",
  "confidence": 0.95,
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
A classificação mais provável para 'Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta' é **6105.10.00 - Camisas de malha, de algodão, para homens ou meninos**.  A descrição detalhada do produto indica claramente que se trata de uma camisa de malha de algodão para homem. O tipo de gola, os botões, o logotipo e os detalhes de acabamento não alteram a classificação NCM principal.

### Observações
- Tempo de resposta total: 22.41 segundos
- Taxa de confiança: 0.95
- Nenhum erro encontrado durante o processamento
