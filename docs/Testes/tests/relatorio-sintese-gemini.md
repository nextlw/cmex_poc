# Relatório de Síntese: Testes do Modelo Gemini com Deep Research

**Data:** 7 de março de 2025

## Resumo Executivo

Este relatório documenta os testes realizados com o modelo Gemini-1.5-Pro na funcionalidade de análise profunda (Deep Research) para classificação fiscal de produtos. O objetivo foi validar o fluxo completo, desde a seleção do modelo no frontend até a obtenção dos resultados detalhados.

Os testes simularam o fluxo real de uso do sistema, incluindo:

1. Seleção do modelo no frontend
2. Inserção da consulta no campo InputAI
3. Processamento da consulta através do buscador profundo (Deep Research)
4. Validação dos resultados obtidos

## Metodologia

### Configuração dos Testes

- **Modelo testado:** Gemini-1.5-Pro
- **Casos de teste:** 2 produtos (camisa polo com diferentes níveis de detalhamento)
- **Expectativa:** Classificação no NCM 6105.10.00
- **Processo:** Simulação do fluxo E2E frontend-backend
- **Instrumentação:** Captura de todos os prompts, respostas e tempo de processamento por etapa
- **Robustez:** Implementação de mecanismo de retry com backoff exponencial

### Arquitetura do Teste

O teste foi estruturado para simular fielmente o fluxo do usuário e capturar evidências detalhadas:

1. **Seleção do modelo:** Simulação da escolha do Gemini no dropdown do frontend
2. **Consulta:** Envio da descrição do produto para o endpoint apropriado
3. **Processo de Deep Research:**
   - Decomposição em 5 etapas sequenciais
   - Captura do prompt e resposta de cada etapa
   - Medição do tempo de processamento
   - Mecanismo de retry para erros temporários (até 3 tentativas)
4. **Validação:** Comparação do NCM obtido com o esperado

## Resultados

### Caso 1: Camisa Polo - Descrição Básica

- **Query:** "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."
- **NCM Esperado:** 6105.10.00
- **NCM Obtido:** 6105.10.00
- **Resultado:** ✅ Classificação correta
- **Tempo total:** 13.56 segundos
- **Confiança:** 0.9 (90%)

#### Detalhamento do Processo

O modelo seguiu 5 etapas sequenciais:

1. **Identificação do NCM (2.40s)**: Determinou corretamente o código 6105.10.00
2. **Análise de características (2.88s)**: Detalhou características relevantes para classificação
3. **Cálculo de tributação (1.65s)**: Definiu as alíquotas aplicáveis
4. **Identificação de atributos específicos (1.89s)**: Destacou características específicas
5. **Conclusão e confiança (4.73s)**: Apresentou justificativa detalhada e nível de confiança

### Caso 2: Camisa Polo - Descrição Detalhada

- **Query:** "Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta."
- **NCM Esperado:** 6105.10.00
- **NCM Obtido:** 6105.10.00
- **Resultado:** ✅ Classificação correta
- **Tempo total:** 22.41 segundos
- **Confiança:** 0.95 (95%)
- **Retentativas:** 3 (devido a erros temporários de quota)

#### Detalhamento do Processo

O modelo seguiu 5 etapas sequenciais com retentativas bem-sucedidas:

1. **Identificação do NCM (2.35s)**: Determinou corretamente o código 6105.10.00
2. **Análise de características (3.01s)**: Necessitou 3 tentativas devido a erros de quota da API
3. **Cálculo de tributação (1.97s)**: Necessitou 2 tentativas devido a erros de quota da API
4. **Identificação de atributos específicos (3.03s)**: Detalhamento completo de todos os atributos relevantes
5. **Conclusão e confiança (3.42s)**: Apresentou justificativa detalhada com alta confiança (95%)

### Análise Qualitativa

A análise qualitativa do teste bem-sucedido demonstra:

1. **Precisão da classificação:** O modelo identificou corretamente o NCM
2. **Qualidade das respostas:** Todas as etapas geraram JSON válido e bem estruturado
3. **Profundidade da análise:** Cada etapa considerou aspectos relevantes (material, formato, uso)
4. **Justificativa clara:** A conclusão apresentou fundamentos consistentes para a classificação
5. **Formato padronizado:** As respostas seguiram o formato esperado pelo frontend
6. **Resiliência:** O sistema de retry garantiu respostas mesmo com erros temporários

## Observações Técnicas

1. **Etapas sequenciais:** O modelo processa a consulta em 5 etapas, cada uma com um objetivo específico
2. **Formato de resposta:** Todas as respostas são estruturadas em JSON com campos específicos
3. **Prompts contextuais:** Cada etapa recebe um prompt especializado para extrair informações específicas
4. **Processamento gradual:** Informações obtidas em etapas anteriores são utilizadas nas subsequentes
5. **Controle de qualidade:** Validação de formato, extração de JSON e verificação de campos obrigatórios
6. **Backoff exponencial:** Retentativas com espera crescente (2s, 4s, 8s) para contornar limitações de API

## Limitações Superadas

1. **Quota de API:** O mecanismo de retry garantiu a obtenção de respostas mesmo com erros temporários
2. **Resiliência:** O sistema manteve o contexto e continuou o processamento após erros temporários
3. **Resultados parciais:** Implementada a capacidade de processar resultados mesmo com falhas em algumas etapas

## Limitações Remanescentes

1. **Tracking de tokens:** Ainda não implementado corretamente (retorna objeto vazio)
2. **Tempo de resposta:** Embora aceitável, o segundo caso (22s) pode ser otimizado

## Conclusão

Os testes demonstram que o modelo Gemini-1.5-Pro, quando integrado ao fluxo de Deep Research com mecanismos de retry:

1. É capaz de classificar corretamente produtos com base em suas descrições
2. Mantém alta precisão e confiança (90-95%) nas classificações
3. Fornece resultados estruturados compatíveis com o frontend
4. Apresenta resiliência contra erros temporários de API
5. Mantém formato padronizado de respostas
6. Processa consultas com diferentes níveis de detalhamento

O processo de Deep Research implementado demonstra ser uma abordagem robusta e confiável para classificação fiscal de produtos, proporcionando não apenas o código NCM, mas também uma análise detalhada e justificada que auxilia o usuário a compreender a classificação.

## Recomendações

1. **Aprimorar o tracking de tokens:** Implementar corretamente o monitoramento de uso
2. **Expandir casos de teste:** Incluir produtos de diferentes categorias
3. **Otimizar prompts:** Refinar instruções para reduzir tempo de processamento
4. **Implementar cache:** Armazenar resultados de consultas frequentes para reduzir chamadas à API
5. **Ajustar parâmetros de retry:** Otimizar tempos de espera baseado em métricas reais de uso

---

**Responsável pelos testes:** Equipe de QA - CMEX
**Data de execução:** 7 de março de 2025
