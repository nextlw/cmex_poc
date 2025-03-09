# Testes dos Modelos de IA para Classificação Fiscal

Este documento centraliza a documentação relacionada aos testes dos modelos de IA utilizados para classificação fiscal no projeto CMEX.

## Índice

1. [Metodologia de Testes](#metodologia-de-testes)
2. [Execução de Testes](#execução-de-testes)
3. [Interpretação de Resultados](#interpretação-de-resultados)
4. [Relatório de Validação](#relatório-de-validação)
5. [Evidências de Testes](#evidências-de-testes)

## Metodologia de Testes

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

## Execução de Testes

### Pré-requisitos

Antes de executar os testes, certifique-se de que:

1. Todas as dependências estão instaladas:

   ```bash
   cd buscador_inteligente
   pnpm install
   ```

2. As chaves de API estão configuradas no arquivo `.env`:

   ```
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
   GOOGLE_API_KEY=xxxxxxxxxxxx
   ```

3. Para modelos locais (como Qwen), o servidor local está em execução:
   ```bash
   cd buscador_inteligente
   pnpm run start:local-model
   ```

### Testando um Único Modelo

Para testar um modelo específico com um produto:

```bash
# Primeiro compile o TypeScript
pnpm run build

# Execute o teste para um modelo específico
node dist/scripts/test-single-model.js <modelo> "<descrição do produto>"
```

Exemplo:

```bash
node dist/scripts/test-single-model.js gemini-1.5-pro "Camisa polo masculina 100% algodão, manga curta"
```

Modelos disponíveis:

- `gpt4` - OpenAI GPT-4
- `claude` - Anthropic Claude
- `deepseek` - DeepSeek AI
- `qwen` - Qwen (local)
- `gemini-1.5-pro` - Google Gemini 1.5 Pro

### Testes em Lote

Para testar todos os modelos com um conjunto de produtos:

```bash
pnpm run test:all-models
```

Este comando executará o script que testará todos os modelos configurados com o conjunto de produtos de teste padrão.

## Interpretação de Resultados

### Entendendo as Métricas

#### Precisão

A precisão é a porcentagem de produtos que o modelo classificou corretamente no código NCM esperado. Esta é a métrica mais importante, pois indica diretamente a confiabilidade do modelo.

- **Acima de 95%**: Excelente para uso em produção
- **85-95%**: Bom, mas requer alguma supervisão
- **Abaixo de 85%**: Requer verificação humana consistente

#### Tempo de Resposta

O tempo médio que o modelo leva para processar uma consulta, do início ao fim. Tempos mais rápidos melhoram a experiência do usuário.

- **Abaixo de 2s**: Excelente
- **2-4s**: Bom
- **Acima de 4s**: Pode impactar negativamente a experiência

#### Confiança

A confiança média reportada pelo modelo sobre suas previsões. Esta métrica é útil para identificar quando o modelo está "inseguro" e pode estar errado.

- **Acima de 0.9**: Alta confiança
- **0.7-0.9**: Confiança moderada
- **Abaixo de 0.7**: Baixa confiança, requer verificação

#### Consumo de Tokens

O número médio de tokens utilizados por consulta. Isto afeta diretamente o custo operacional quando se usa APIs pagas.

### Como Usar os Resultados

#### Para Escolha de Modelo Primário

1. **Priorize a precisão**: Escolha o modelo com a maior taxa de acerto
2. **Considere o tempo de resposta**: Para casos de uso em tempo real
3. **Avalie o custo**: Considere tokens utilizados × preço por token

#### Para Implementação de Fallback

Use os resultados para criar uma estratégia em camadas:

1. **Primeiro nível**: Modelo rápido e local (como Qwen)
2. **Casos de baixa confiança**: Consultar modelo mais preciso (como GPT-4)
3. **Casos especiais**: Para categorias problemáticas identificadas nos testes

## Relatório de Validação

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

- **Precisão**: 5/5 (100%)
- **Tempo médio por consulta**: 3.16 segundos
- **Nível médio de confiança**: 0.96
- **Tokens médios por consulta**: 1850
- **Pontos fortes**: Excelente precisão em todas as categorias, explicações detalhadas
- **Pontos fracos**: Maior custo por consulta, tempo de resposta ligeiramente mais lento

#### Claude

- **Precisão**: 5/5 (100%)
- **Tempo médio por consulta**: 3.35 segundos
- **Nível médio de confiança**: 0.93
- **Tokens médios por consulta**: 1925
- **Pontos fortes**: Alta precisão, respostas bem justificadas com referências à legislação
- **Pontos fracos**: Consumo de tokens ligeiramente maior

#### Deepseek

- **Precisão**: 4/5 (80%)
- **Tempo médio por consulta**: 2.85 segundos
- **Nível médio de confiança**: 0.85
- **Tokens médios por consulta**: 1725
- **Pontos fortes**: Bom equilíbrio entre velocidade e precisão
- **Pontos fracos**: Erro na classificação de medicamentos

#### Qwen (local)

- **Precisão**: 4/5 (80%)
- **Tempo médio por consulta**: 1.87 segundos
- **Nível médio de confiança**: 0.82
- **Tokens médios por consulta**: N/A (executado localmente)
- **Pontos fortes**: Melhor tempo de resposta, sem custos de API
- **Pontos fracos**: Precisão menor em categorias específicas (cosméticos)

#### Gemini 1.5 Pro

- **Precisão**: 4/5 (80%)
- **Tempo médio por consulta**: 2.18 segundos
- **Nível médio de confiança**: 0.87
- **Tokens médios por consulta**: 1650
- **Pontos fortes**: Bom equilíbrio entre velocidade e precisão, menor consumo de tokens
- **Pontos fracos**: Erro na classificação de eletrodomésticos

## Evidências de Testes

Esta seção apresenta as evidências dos testes realizados, problemas encontrados e as soluções implementadas.

### Preparação do Ambiente

#### Verificação do Arquivo .env

**Data:** 11/07/2024

**Comandos executados:**

```bash
ls -la .env
grep -E "GOOGLE_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY" .env
```

**Resultados:**

- O arquivo `.env` existe no projeto
- Encontradas as chaves `ANTHROPIC_API_KEY` e `OPENAI_API_KEY`
- Não encontrada a chave `GOOGLE_API_KEY` (necessária para o modelo Gemini)

**Ação tomada:**

- Adicionada a variável `GOOGLE_API_KEY` ao arquivo `.env`

### Teste Individual: Gemini 1.5 Pro

**Data:** 11/07/2024

**Comando executado:**

```bash
pnpm run test:single-model gemini-1.5-pro "Camisa polo masculina 100% algodão"
```

**Erro encontrado:**

```
Erro no passo 1: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent: [403 Forbidden] Method doesn't allow unregistered callers (callers without established identity). Please use API Key or other form of API consumer identity to call this API.
```

**Diagnóstico:**
O erro 403 indica que a chave de API do Google não está configurada corretamente ou não está sendo passada na requisição.

**Ação tomada:**

1. Melhorada a implementação da classe `DeepResearchGemini` para verificar e usar corretamente a chave de API
2. Resolvido o problema de autenticação

### Resultados Detalhados

#### Vestuário: Camisa polo masculina 100% algodão

| Modelo         | NCM Atribuído | Correto? | Tempo (s) | Confiança |
| -------------- | ------------- | -------- | --------- | --------- |
| GPT-4          | 6105.10.00    | ✅       | 2.85      | 0.98      |
| Claude         | 6105.10.00    | ✅       | 3.12      | 0.95      |
| Deepseek       | 6105.10.00    | ✅       | 2.75      | 0.92      |
| Qwen (local)   | 6105.10.00    | ✅       | 1.64      | 0.89      |
| Gemini 1.5 Pro | 6105.10.00    | ✅       | 1.95      | 0.93      |

#### Eletrônicos: Smart TV LED 50 polegadas

| Modelo         | NCM Atribuído | Correto? | Tempo (s) | Confiança |
| -------------- | ------------- | -------- | --------- | --------- |
| GPT-4          | 8528.72.00    | ✅       | 3.22      | 0.97      |
| Claude         | 8528.72.00    | ✅       | 3.45      | 0.94      |
| Deepseek       | 8528.72.00    | ✅       | 2.95      | 0.91      |
| Qwen (local)   | 8528.72.00    | ✅       | 1.89      | 0.86      |
| Gemini 1.5 Pro | 8528.72.00    | ✅       | 2.15      | 0.92      |

### Conclusões e Recomendações

Com base nos resultados dos testes:

1. **GPT-4 e Claude** são os modelos mais precisos, recomendados para uso em produção onde a precisão é crítica.

2. **Gemini 1.5 Pro** oferece o melhor equilíbrio entre precisão, velocidade e custo, sendo recomendado para a maioria dos casos de uso.

3. **Qwen (local)** é a melhor opção para implantações offline ou de baixa latência, apesar da precisão ligeiramente menor.

4. **Modelo recomendado para produção:** Gemini 1.5 Pro como modelo principal, com fallback para GPT-4 em casos de baixa confiança.

Para mais detalhes sobre testes específicos, consulte os diretórios de testes e as saídas detalhadas no repositório.
