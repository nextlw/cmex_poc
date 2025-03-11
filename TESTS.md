# Documentação dos Testes

## Visão Geral

Este documento descreve os testes implementados no projeto, incluindo sua estrutura, cobertura e instruções de execução.

## Estrutura dos Testes

Os testes estão organizados por módulo, seguindo a estrutura do projeto:

```
src/
  tools/
    __tests__/
      evaluator.test.ts
      jinaSearch.test.ts
      query-rewriter.test.ts
      brave-search.test.ts
      error-analyzer.test.ts
      search.test.ts
      dedup.test.ts
```

## Testes por Módulo

### 1. Jina Search (`jinaSearch.test.ts`)

Testa a funcionalidade de busca usando a API do Jina.

```typescript
describe("jinaSearch", () => {
  it("should return search results", async () => {
    // Verifica se a função retorna resultados válidos
  });

  it("should handle empty query", async () => {
    // Verifica o tratamento de queries vazias
  });
});
```

### 2. Brave Search (`brave-search.test.ts`)

Testa a funcionalidade de busca usando a API do Brave.

```typescript
describe("braveSearch", () => {
  it("should return search results", async () => {
    // Verifica se a função retorna resultados válidos
  });

  it("should handle API errors gracefully", async () => {
    // Verifica o tratamento de erros da API
  });
});
```

### 3. Error Analyzer (`error-analyzer.test.ts`)

Testa a análise de erros com dados reais.

```typescript
describe("analyzeSteps", () => {
  it("should analyze error steps", async () => {
    // Verifica a análise básica de erros
  });

  it("should analyze error steps with real data", async () => {
    // Verifica a análise com dados reais
  });
});
```

### 4. Query Rewriter (`query-rewriter.test.ts`)

Testa a reescrita de queries de busca.

```typescript
describe("rewriteQuery", () => {
  it("should rewrite search query", async () => {
    // Verifica a reescrita de queries
  });
});
```

### 5. Evaluator (`evaluator.test.ts`)

Testa a avaliação de respostas.

```typescript
describe("evaluateAnswer", () => {
  it("should evaluate answer definitiveness", async () => {
    // Verifica a avaliação de respostas
  });
});
```

### 6. Dedup (`dedup.test.ts`)

Testa a remoção de queries duplicadas.

```typescript
describe("dedupQueries", () => {
  it("should remove duplicate queries", async () => {
    // Verifica a remoção de duplicatas
  });

  it("should handle empty input", async () => {
    // Verifica o tratamento de entrada vazia
  });
});
```

### 7. Search (`search.test.ts`)

Testa a funcionalidade geral de busca.

```typescript
describe("search", () => {
  it("should handle empty query", async () => {
    // Verifica o tratamento de queries vazias
  });

  // Teste pulado devido a saldo insuficiente
  it.skip("should perform search with Jina API", async () => {
    // Teste de integração com a API do Jina
  });
});
```

## Cobertura de Testes

### Métricas Atuais

- Statements: 53.64%
- Branches: 38.46%
- Functions: 50.63%
- Lines: 54.37%

### Áreas que Precisam de Mais Cobertura

1. **Módulos com Baixa Cobertura**:

   - `dedup.ts`: 23.91% de cobertura
   - `evaluator.ts`: 36.55% de cobertura
   - `read.ts`: 17.85% de cobertura

2. **Componentes que Precisam de Mais Testes**:
   - Funções de processamento de texto
   - Validações de entrada
   - Tratamento de erros específicos

## Executando os Testes

### Comando

```bash
npm test
```

### Opções

- `--coverage`: Gera relatório de cobertura
- `--watch`: Executa testes em modo watch
- `--verbose`: Mostra detalhes adicionais

### Exemplo

```bash
# Executar todos os testes
npm test

# Executar com cobertura
npm test -- --coverage

# Executar em modo watch
npm test -- --watch
```

## Próximos Passos

1. **Aumentar Cobertura**:

   - Implementar testes para `dedup.ts`
   - Adicionar testes para `evaluator.ts`
   - Criar testes para `read.ts`

2. **Melhorar Qualidade**:

   - Adicionar testes de integração
   - Implementar testes de performance
   - Criar testes de regressão

3. **Documentação**:
   - Adicionar exemplos de uso
   - Criar guias de contribuição
   - Documentar padrões de teste

## Observações

- Alguns testes podem ser pulados devido a limitações do ambiente
- A cobertura de testes está abaixo do threshold desejado
- É necessário implementar mais testes de integração
