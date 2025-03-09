# Testes de Validação de Modelos de IA

Este diretório contém relatórios de validação dos diversos modelos de IA utilizados na classificação fiscal (NCM) de produtos.

## Sobre os Testes

Os testes são projetados para avaliar:

1. **Precisão**: Capacidade do modelo em identificar o NCM correto
2. **Tempo de Resposta**: Velocidade de processamento da consulta
3. **Confiança**: Nível de certeza do modelo sobre suas previsões
4. **Uso de Tokens**: Eficiência no consumo de tokens (relevante para custos de API)

## Conjunto de Dados

Os testes utilizam um conjunto de produtos reais com NCMs conhecidos, abrangendo diferentes categorias:

- Vestuário
- Eletrônicos
- Eletrodomésticos
- Medicamentos
- Cosméticos

## Modelos Testados

- GPT-4 (OpenAI)
- Claude (Anthropic)
- Deepseek
- Qwen (Alibaba)
- Gemini (Google)

## Como Executar os Testes

Para executar os testes e gerar um novo relatório:

```bash
cd buscador_inteligente
npm run test:models
```

O relatório será gerado no formato Markdown e salvo neste diretório com a data de execução.

## Estrutura do Relatório

Cada relatório inclui:

- Resumo geral com taxa de acerto por modelo
- Detalhes específicos de cada modelo
- Exemplos de respostas para análise qualitativa
- Métricas de desempenho (tempo de processamento)
- Conclusões e recomendações

## Observações Importantes

- Os testes fazem chamadas reais às APIs e, portanto, consomem créditos
- É necessário ter as chaves de API configuradas no arquivo `.env`
- Para modelos locais, o servidor local deve estar em execução
