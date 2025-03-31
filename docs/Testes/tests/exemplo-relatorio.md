# Relatório de Validação dos Modelos de IA

**Data:** 2024-07-10

**Tempo total de execução:** 382.45 segundos

## Resumo

| Modelo         | Acertos | Total | Taxa de Acerto |
| -------------- | ------- | ----- | -------------- |
| gpt4           | 5       | 5     | 100.00%        |
| claude         | 5       | 5     | 100.00%        |
| deepseek       | 4       | 5     | 80.00%         |
| qwen           | 4       | 5     | 80.00%         |
| gemini-1.5-pro | 4       | 5     | 80.00%         |

## Detalhes por Modelo

### Modelo: gpt4

| Produto                | NCM Esperado | NCM Obtido | Correto | Tempo (s) | Confiança |
| ---------------------- | ------------ | ---------- | ------- | --------- | --------- |
| Camisa Polo            | 6105.10.00   | 6105.10.00 | ✅      | 3.42      | 0.95      |
| Smart TV               | 8528.72.00   | 8528.72.00 | ✅      | 3.89      | 0.98      |
| Cafeteira Elétrica     | 8516.71.00   | 8516.71.00 | ✅      | 2.75      | 0.97      |
| Medicamento Analgésico | 3004.90.19   | 3004.90.19 | ✅      | 3.21      | 0.93      |
| Perfume                | 3303.00.20   | 3303.00.20 | ✅      | 2.55      | 0.96      |

#### Exemplos de Resposta

**Produto:** Camisa Polo

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

### Modelo: gemini-1.5-pro

| Produto                | NCM Esperado | NCM Obtido | Correto | Tempo (s) | Confiança |
| ---------------------- | ------------ | ---------- | ------- | --------- | --------- |
| Camisa Polo            | 6105.10.00   | 6105.10.00 | ✅      | 2.45      | 0.87      |
| Smart TV               | 8528.72.00   | 8528.72.00 | ✅      | 2.12      | 0.92      |
| Cafeteira Elétrica     | 8516.71.00   | 8516.71.00 | ✅      | 1.98      | 0.90      |
| Medicamento Analgésico | 3004.90.19   | 3004.90.29 | ❌      | 2.31      | 0.75      |
| Perfume                | 3303.00.20   | 3303.00.20 | ✅      | 2.05      | 0.89      |

#### Exemplos de Resposta

**Produto:** Camisa Polo

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

## Conclusão

Este relatório apresenta os resultados dos testes realizados em 5 produtos reais, utilizando 5 modelos diferentes de IA para classificação fiscal (NCM).

Os resultados mostram que:

1. O GPT-4 e Claude apresentaram a maior precisão, com 100% de acertos.
2. Os modelos Deepseek, Qwen e Gemini tiveram uma taxa de acerto de 80%.
3. O GPT-4 proporcionou o maior nível de confiança médio nas classificações (96%).
4. O Gemini apresentou os tempos de resposta mais rápidos, com média de 2.18 segundos por consulta.

Baseado nos resultados, recomendamos:

- Para máxima precisão: GPT-4 ou Claude
- Para resposta mais rápida: Gemini
- Para melhor custo-benefício: Qwen (modelo local) ou Gemini (considerando preço por token)

Os testes mostram que para casos específicos como medicamentos, modelos mais especializados podem ser necessários para melhorar a precisão da classificação.
