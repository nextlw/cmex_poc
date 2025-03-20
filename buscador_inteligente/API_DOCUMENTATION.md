# Documentação da API

Este documento descreve as APIs disponíveis no servidor de busca inteligente, com foco nas APIs de consulta de NCM e teste.

## Configuração do Ambiente

Para executar o servidor em modo de desenvolvimento com respostas mockadas:

```bash
PORT=3000 NODE_ENV=development MOCK_RESPONSES=true npm run server
```

Ou utilize o script de inicialização fornecido:

```bash
./start-dev-server.sh
```

## Endpoints

### Consulta de NCM

Endpoint para consultar a classificação fiscal (NCM) de produtos.

- **URL**: `/api/v1/ncm`
- **Método**: `POST`
- **Tipo de Conteúdo**: `application/json`

#### Parâmetros da Requisição

| Parâmetro        | Tipo    | Descrição                        | Obrigatório          |
| ---------------- | ------- | -------------------------------- | -------------------- |
| consulta         | string  | Descrição do produto             | Sim                  |
| estadoOrigem     | string  | Estado de origem (sigla)         | Sim                  |
| operacao         | string  | Tipo de operação                 | Não                  |
| regimeTributario | string  | Regime tributário                | Não                  |
| tributacao       | string  | Tipo de tributação               | Não                  |
| modelo           | string  | Modelo de IA a ser utilizado     | Sim                  |
| useDeepResearch  | boolean | Ativa o modo de análise profunda | Não (default: false) |

#### Modelos Disponíveis

| Nome do Modelo         | Descrição                 |
| ---------------------- | ------------------------- |
| Nex-0.1-Pro-2024       | Utiliza GPT-4             |
| Nex-0.3-Preview-2024   | Utiliza Claude            |
| Nex-0.5-Preview-2025   | Utiliza Deepseek          |
| Qwen2.5-7b-instruct-1m | Utiliza modelo local Qwen |

#### Modo DeepResearch

Esta API agora suporta dois fluxos de processamento:

1. **Fluxo Padrão** (`useDeepResearch=false`):

   - Consulta direta ao FastAPI
   - Resultado sem processamento adicional

2. **Fluxo DeepResearch** (`useDeepResearch=true`):
   - Consulta ao FastAPI seguida de análise profunda
   - Resultado enriquecido com metadados de validação e confiança
   - Inclui seção `validacao_profunda` na resposta

#### Exemplo de Requisição Padrão

```json
{
  "consulta": "camisa polo masculina",
  "estadoOrigem": "SP",
  "operacao": "Venda",
  "regimeTributario": "Simples Nacional",
  "tributacao": "Normal",
  "modelo": "Qwen2.5-7b-instruct-1m"
}
```

#### Exemplo de Requisição com DeepResearch

```json
{
  "consulta": "camisa polo masculina",
  "estadoOrigem": "SP",
  "operacao": "Venda",
  "regimeTributario": "Simples Nacional",
  "tributacao": "Normal",
  "modelo": "Nex-0.3-Preview-2024",
  "useDeepResearch": true
}
```

#### Exemplo de Resposta

```json
{
  "ncm": "61.05.10.00",
  "descricao": "Camisa polo masculina, confeccionada em malha de algodão, com gola e abertura frontal parcial com fechamento por botões.",
  "atributos": [
    "Confeccionada em malha de algodão",
    "Gola polo com fechamento por botões",
    "Manga curta",
    "Para uso masculino",
    "Produto acabado, pronto para uso"
  ],
  "atributos_tipi": [
    "Camisas de malha, de algodão, de uso masculino",
    "Produto do capítulo 61 - Vestuário e seus acessórios, de malha",
    "Produto da posição 61.05 - Camisas de malha, de uso masculino"
  ],
  "valores_de_impostos": {
    "ipi": "0%",
    "icms": { "SP": "18%" },
    "pis": "1,65%",
    "cofins": "7,6%"
  },
  "classificacao_tributaria": {
    "tipo_classificacao_tributario": {
      "tipo_tributario_ativo": "CST 01 - Operação Tributável com Alíquota Básica",
      "justificativa": "Produto nacional tributado normalmente, sem benefícios fiscais específicos. A classificação como CST 01 é devido à natureza do produto como vestuário acabado, tributado pelas alíquotas básicas de PIS (1,65%) e COFINS (7,6%), sem direito a crédito específico."
    },
    "ipi_entrada": "0%",
    "ipi_saida": "0%",
    "pis_entrada": "1,65%",
    "pis_saida": "1,65%",
    "cofins_entrada": "7,6%",
    "cofins_saida": "7,6%",
    "cst_entrada": "01",
    "cst_saida": "01"
  }
}
```

#### Exemplo de Resposta com DeepResearch Ativado

```json
{
  "ncm": "61.05.10.00",
  "descricao": "Camisa polo masculina, confeccionada em malha de algodão, com gola e abertura frontal parcial com fechamento por botões.",

  /* ... outros campos iguais à resposta padrão ... */

  "validacao_profunda": {
    "resultado": {
      /* Dados da validação */
    },
    "confianca": 95,
    "timestamp": "2025-02-26T18:34:25.123Z",
    "modelo_utilizado": "claude"
  },
  "observacoes_deep_research": [
    "Classificação validada com base em produtos similares no mercado",
    "Alíquotas de impostos compatíveis com a legislação atual",
    "Verificada compatibilidade com a TIPI 2024"
  ],
  "_meta": {
    "processamento": "deep_research",
    "tempo_processamento": 1.25,
    "timestamp": "2025-02-26T18:34:25.123Z"
  }
}
```

#### Códigos de Status

| Código | Descrição                                                                 |
| ------ | ------------------------------------------------------------------------- |
| 200    | Sucesso                                                                   |
| 400    | Requisição inválida (parâmetros obrigatórios ausentes ou modelo inválido) |
| 500    | Erro interno do servidor                                                  |

### Rota de Teste (Trash Query)

Endpoint para testes e desenvolvimento, que simplesmente recebe e registra uma consulta.

- **URL**: `/api/v1/trash-query`
- **Método**: `POST`
- **Tipo de Conteúdo**: `application/json`

#### Parâmetros da Requisição

Aceita qualquer objeto JSON.

#### Exemplo de Requisição

```json
{
  "query": "Teste de API",
  "context": "Apenas um teste"
}
```

#### Exemplo de Resposta

```json
{
  "status": "success",
  "message": "Consulta de teste recebida com sucesso",
  "timestamp": "2025-02-26T18:24:38.094Z",
  "query": {
    "query": "Teste de API",
    "context": "Apenas um teste"
  }
}
```

#### Códigos de Status

| Código | Descrição |
| ------ | --------- |
| 200    | Sucesso   |

## Modo de Desenvolvimento

Para facilitar o desenvolvimento sem depender de um modelo local, você pode ativar o modo de respostas mockadas usando as variáveis de ambiente:

```bash
NODE_ENV=development MOCK_RESPONSES=true
```

Neste modo, a API de NCM retornará respostas pré-definidas para testes, permitindo o desenvolvimento da interface sem necessidade de um serviço de modelo em execução.

## Implementação de Componentes Front-end

### DeepResearchToggle

Um componente React foi desenvolvido para facilitar a integração do modo DeepResearch na interface do usuário:

```tsx
import DeepResearchToggle from "./components/DeepResearchToggle";

function MyComponent() {
  const [useDeepResearch, setUseDeepResearch] = useState(false);

  return (
    <DeepResearchToggle
      enabled={useDeepResearch}
      onChange={setUseDeepResearch}
      helpText="Ative para análise profunda e validação adicional dos resultados"
    />
  );
}
```

### Componente de Formulário

Um componente de formulário completo para consulta NCM também está disponível:

```tsx
import NCMConsultaForm from "./components/NCMConsultaForm";

function MyPage() {
  const handleResult = (result) => {
    console.log("Resultado da consulta:", result);
  };

  return (
    <NCMConsultaForm
      onResult={handleResult}
      initialData={{ estadoOrigem: "SP" }}
    />
  );
}
```
