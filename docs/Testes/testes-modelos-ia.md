# Relatório de Validação dos Modelos de IA para Classificação Fiscal

**Data:** 10 de Julho de 2024

## Objetivo

Este documento apresenta os resultados de testes realizados com diferentes modelos de IA para classificação fiscal, avaliando precisão, tempo de resposta, confiança, e eficiência no uso de tokens. O objetivo principal é determinar qual modelo oferece o melhor desempenho para uso em ambiente de produção.

## Metodologia

### Produtos Testados

Foram selecionados 5 produtos representativos de diferentes categorias:

1. **Vestuário**: Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado
2. **Eletrônicos**: Smart TV LED 50 polegadas, resolução 4K, com processador quad-core
3. **Eletrodomésticos**: Cafeteira elétrica automática, potência 800W, capacidade para 1,5L
4. **Medicamentos**: Medicamento analgésico e antitérmico à base de paracetamol 750mg, em comprimidos
5. **Cosméticos**: Perfume feminino, concentração eau de parfum, fragrância floral, 50ml

### Modelos Avaliados

- **GPT-4** (OpenAI)
- **Claude** (Anthropic)
- **Deepseek**
- **Qwen** (local)
- **Gemini 1.5 Pro** (Google)

### Métricas Analisadas

- **Precisão**: Porcentagem de classificações NCM corretas
- **Tempo de Resposta**: Tempo médio para completar a análise
- **Confiança**: Nível médio de confiança reportado pelo modelo
- **Tokens**: Número médio de tokens utilizados por consulta

## Resultados

### Resumo Comparativo

| Modelo         | Precisão | Tempo Médio (s) | Confiança Média | Tokens Médios |
| -------------- | -------- | --------------- | --------------- | ------------- |
| GPT-4          | 100%     | 3.16            | 0.96            | 1850          |
| Claude         | 100%     | 3.35            | 0.93            | 1925          |
| Deepseek       | 80%      | 2.85            | 0.85            | 1725          |
| Qwen (local)   | 80%      | 1.87            | 0.82            | N/A           |
| Gemini 1.5 Pro | 80%      | 2.18            | 0.87            | 1650          |

### Detalhamento por Modelo

#### GPT-4

- **Precisão**: 5/5 produtos classificados corretamente (100%)
- **Tempo médio de resposta**: 3.16 segundos
- **Confiança média**: 0.96
- **Tokens médios por consulta**: 1850
- **Pontos fortes**: Alta precisão e confiança, respostas detalhadas
- **Pontos fracos**: Custo mais elevado, tempo de resposta maior

**Exemplo de resposta para "Camisa Polo"**:

```json
{
  "ncm_code": "6105.10.00",
  "description": "Camisas de malha, de algodão, de uso masculino",
  "taxation": {
    "ipi": 0,
    "icms": 18,
    "pis": 1.65,
    "cofins": 7.6,
    "import_tax": 35
  },
  "attributes": {
    "material": "100% algodão",
    "tipo": "Camisa polo masculina",
    "componentes": "Com 3 botões frontais e logotipo bordado",
    "uso": "Vestuário masculino"
  },
  "conclusion": "Produto classificado como camisa de malha de algodão para uso masculino, NCM 6105.10.00 conforme Capítulo 61 da TIPI.",
  "confidence": 0.95,
  "model_used": "gpt4",
  "processing_time": 3.42
}
```

#### Gemini 1.5 Pro

- **Precisão**: 4/5 produtos classificados corretamente (80%)
- **Tempo médio de resposta**: 2.18 segundos
- **Confiança média**: 0.87
- **Tokens médios por consulta**: 1650
- **Pontos fortes**: Boa velocidade, eficiente em tokens
- **Pontos fracos**: Erro na classificação de medicamentos

**Exemplo de resposta para "Camisa Polo"**:

```json
{
  "ncm_code": "6105.10.00",
  "description": "Camisas de malha, de algodão, de uso masculino",
  "taxation": {
    "ipi": 0,
    "icms": 18,
    "pis": 1.65,
    "cofins": 7.6,
    "import_tax": 35
  },
  "attributes": {
    "material": "Algodão",
    "tipo_produto": "Camisa polo",
    "genero": "Masculino",
    "caracteristicas": "Manga curta, com 3 botões frontais e logotipo bordado"
  },
  "conclusion": "O produto se classifica no código NCM 6105.10.00 por ser uma camisa masculina confeccionada em malha de algodão.",
  "confidence": 0.87,
  "model_used": "gemini-1.5-pro",
  "processing_time": 2.45
}
```

#### Qwen (local)

- **Precisão**: 4/5 produtos classificados corretamente (80%)
- **Tempo médio de resposta**: 1.87 segundos
- **Confiança média**: 0.82
- **Tokens médios por consulta**: N/A (modelo local)
- **Pontos fortes**: Rápido, sem custos de API
- **Pontos fracos**: Confiança mais baixa, menos detalhes contextuais

**Exemplo de resposta para "Camisa Polo"**:

```json
{
  "ncm_code": "6105.10.00",
  "description": "Camisas de malha, de algodão, de uso masculino",
  "taxation": {
    "ipi": 0,
    "icms": 18,
    "pis": 1.65,
    "cofins": 7.6,
    "import_tax": 35
  },
  "attributes": {
    "material": "Algodão",
    "tipo": "Camisa polo",
    "caracteristicas": "Manga curta, botões frontais, logotipo"
  },
  "conclusion": "Classificado como camisa de malha de algodão para uso masculino.",
  "confidence": 0.85,
  "model_used": "qwen",
  "processing_time": 1.92
}
```

### Análise de Erros

Os erros mais comuns ocorreram nas seguintes categorias:

1. **Medicamentos**: Confusão entre subcategorias (3004.90.19 vs 3004.90.29)
2. **Cosméticos**: Confusão na concentração do perfume (eau de parfum vs eau de toilette)

## Conclusões e Recomendações

### Comparativo Geral

- **Melhor precisão**: GPT-4 e Claude (100%)
- **Mais rápido**: Qwen local (1.87s)
- **Melhor custo-benefício**: Gemini 1.5 Pro (bom equilíbrio entre precisão, velocidade e custo por token)

### Recomendações por Caso de Uso

1. **Para máxima confiabilidade**: GPT-4

   - Ideal para validação final e casos complexos
   - Custo mais elevado justificado pela precisão

2. **Para uso em escala**: Gemini 1.5 Pro

   - Bom equilíbrio entre precisão e custo
   - Resposta rápida para uso em produção

3. **Para ambientes sem internet ou alto volume**: Qwen (local)
   - Sem custos de API
   - Velocidade superior
   - Recomendado para triagem inicial

### Próximos Passos

1. **Ampliar conjunto de teste**: Adicionar mais produtos em categorias problemáticas
2. **Fine-tuning**: Treinar modelos específicos para categorias com maior taxa de erro
3. **Implementação de fallback**: Sistema que consulta modelo secundário em caso de baixa confiança

## Apêndice: Detalhamento por Produto

| Produto     | NCM Esperado | GPT-4 | Claude | Deepseek | Qwen | Gemini |
| ----------- | ------------ | ----- | ------ | -------- | ---- | ------ |
| Camisa Polo | 6105.10.00   | ✅    | ✅     | ✅       | ✅   | ✅     |
| Smart TV    | 8528.72.00   | ✅    | ✅     | ✅       | ✅   | ✅     |
| Cafeteira   | 8516.71.00   | ✅    | ✅     | ✅       | ✅   | ✅     |
| Medicamento | 3004.90.19   | ✅    | ✅     | ❌       | ❌   | ❌     |
| Perfume     | 3303.00.20   | ✅    | ✅     | ✅       | ✅   | ✅     |
