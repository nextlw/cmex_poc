# Como Executar Testes de Modelos Manualmente

Este guia explica como executar testes de validação dos modelos de IA de classificação fiscal, seja para todos os modelos ou para um modelo específico.

## Pré-requisitos

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

## Testando um Único Modelo

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
- `deepseek` - Deepseek
- `qwen` - Qwen (local)
- `gemini-1.5-pro` - Google Gemini 1.5 Pro

## Testando Todos os Modelos

Para executar testes completos com todos os modelos e produtos:

```bash
pnpm run test:models
```

Isto executará o script `model-validation.test.ts` que testará cada modelo com um conjunto predefinido de produtos, gerando um relatório detalhado em Markdown.

## Personalizando os Testes

### Modificando os Produtos de Teste

Para modificar os produtos utilizados no teste, edite o array `testProducts` no arquivo `tests/model-validation.test.ts`:

```typescript
const testProducts = [
  {
    name: "Seu Produto",
    description: "Descrição detalhada do produto",
    expectedNCM: "1234.56.78",
  },
  // Adicione mais produtos...
];
```

### Modificando os Modelos Testados

Para alterar quais modelos são testados, edite o array `modelsToTest` no arquivo `tests/model-validation.test.ts`:

```typescript
const modelsToTest = [
  "gpt4",
  "gemini-1.5-pro",
  // Adicione ou remova modelos...
];
```

## Interpretando os Resultados

Após a execução dos testes, um relatório será gerado na pasta `docs/tests/` com o nome `modelos-ia-teste-YYYY-MM-DD.md`.

O relatório contém:

- Taxa de acerto por modelo
- Tempo de resposta
- Nível de confiança
- Exemplos de resposta
- Conclusões e recomendações

Consulte o arquivo `docs/como-interpretar-testes.md` para mais informações sobre como analisar os resultados.

## Solução de Problemas

### Tokens ou Créditos Insuficientes

Se você encontrar erros relacionados a limites de API:

- Verifique se suas chaves de API têm créditos suficientes
- Reduza o número de produtos no teste
- Aguarde o reset do limite de taxa da API

### Erros de Conexão

Para problemas de conexão com as APIs:

- Verifique sua conexão com a internet
- Confirme se as APIs estão operacionais
- Verifique logs de erros para detalhes específicos

### Modelos Locais Indisponíveis

Se os modelos locais não responderem:

- Verifique se o servidor local está em execução
- Confirme que as portas corretas estão configuradas
- Verifique os requisitos de hardware mínimos para o modelo

## Executando Testes em Ambiente CI/CD

Para execução automatizada em pipelines CI/CD:

```yaml
# Exemplo para GitHub Actions
jobs:
  model-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - name: Install dependencies
        run: pnpm install
      - name: Run model tests
        run: pnpm run test:models
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
```

Certifique-se de configurar os secrets no seu repositório.
