# Teste E2E - Camisa Polo - Caso com Detalhes Específicos

## Data: 2025-03-07

### Configuração do Teste
- **Modelo Selecionado:** gemini-1.5-pro
- **Query:** "Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta."

### Resultado
- **NCM Esperado:** 6105.10.00
- **NCM Obtido:** N/A
- **Resultado:** ❌ Incorreto
- **Tempo de Processamento Total:** 0.20 segundos
- **Confiança:** N/A

## Processo de Análise Profunda (Deep Research)

### Resumo
- **Total de Etapas:** 1
- **Etapas Concluídas com Sucesso:** 0
- **Tempo Total de Processamento:** 0.20 segundos

### Detalhes das Etapas

#### Etapa 1: Identificação do código NCM

- **Status:** ❌ Falha
- **Tempo de Processamento:** 0.20 segundos

**Prompt Enviado:**
```
Analise o produto: "Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta."

Identifique o código NCM mais apropriado para este produto. Forneça o código e uma breve justificativa.
```

**Erro:**
```
[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent: [429 Too Many Requests] Resource has been exhausted (e.g. check quota).
```

### Resultado Consolidado
```json
{
  "ncm_code": "",
  "description": "",
  "attributes": {},
  "taxation": {
    "ipi": 0,
    "icms": 0,
    "pis": 0,
    "cofins": 0,
    "import_tax": 0
  },
  "conclusion": "",
  "confidence": 0,
  "model_used": "gemini-1.5-pro",
  "processing_time": 0
}
```

### Análise de Tokens
```json
{}
```

### Conclusão
O modelo gemini-1.5-pro não classificou corretamente o produto no código NCM esperado. 


### Observações
- Tempo de resposta total: 0.20 segundos
- Taxa de confiança: N/A
- Nenhum erro encontrado durante o processamento
