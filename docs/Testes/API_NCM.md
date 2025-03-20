# API de Consulta NCM

Esta documentação descreve a API de consulta de NCM (Nomenclatura Comum do Mercosul) disponível no CMEX Backend.

## Visão Geral

A API de NCM permite consultar a classificação fiscal de produtos através de diferentes modelos de IA. Ela fornece informações detalhadas sobre a classificação NCM, incluindo:

- Código NCM
- Descrição do produto
- Atributos para cadastro no CISCOMEX
- Atributos da tabela TIPI
- Valores de impostos
- Classificação tributária

## Endpoints

### Consulta de NCM

- **URL**: `/api/v1/ncm`
- **Método**: `POST`
- **Tipo de Conteúdo**: `application/json`

#### Parâmetros da Requisição

| Parâmetro        | Tipo   | Descrição                    | Obrigatório |
| ---------------- | ------ | ---------------------------- | ----------- |
| consulta         | string | Descrição do produto         | Sim         |
| estadoOrigem     | string | Estado de origem (sigla)     | Sim         |
| operacao         | string | Tipo de operação             | Não         |
| regimeTributario | string | Regime tributário            | Não         |
| tributacao       | string | Tipo de tributação           | Não         |
| modelo           | string | Modelo de IA a ser utilizado | Sim         |

#### Modelos Disponíveis

| Nome do Modelo         | Descrição                 |
| ---------------------- | ------------------------- |
| Nex-0.1-Pro-2024       | Utiliza GPT-4             |
| Nex-0.3-Preview-2024   | Utiliza Claude            |
| Nex-0.5-Preview-2025   | Utiliza Deepseek          |
| Qwen2.5-7b-instruct-1m | Utiliza modelo local Qwen |

#### Exemplo de Requisição

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

## Códigos de Status

| Código | Descrição                                                                 |
| ------ | ------------------------------------------------------------------------- |
| 200    | Sucesso                                                                   |
| 400    | Requisição inválida (parâmetros obrigatórios ausentes ou modelo inválido) |
| 500    | Erro interno do servidor                                                  |

### Exemplos de Erros

#### Erro de Parâmetros Faltantes

```json
{
  "status_code": 400,
  "errors": [
    {
      "loc": ["body"],
      "msg": "Dados obrigatórios não fornecidos",
      "type": "error.invalid_request",
      "ctx": { "dados_fornecidos": ["consulta"] }
    }
  ],
  "message": "Requisição inválida",
  "error_type": "invalid_request"
}
```

#### Erro de Modelo Inválido

```json
{
  "status_code": 400,
  "errors": [
    {
      "loc": ["body", "modelo"],
      "msg": "Modelo não encontrado ou inválido",
      "type": "error.invalid_value",
      "ctx": { "valor_fornecido": "modelo-inexistente" }
    }
  ],
  "message": "Modelo não encontrado ou inválido",
  "error_type": "invalid_value"
}
```

## Modo de Desenvolvimento

Para facilitar o desenvolvimento sem depender de um modelo local, você pode ativar o modo de respostas mockadas usando as variáveis de ambiente:

```bash
NODE_ENV=development MOCK_RESPONSES=true
```

Para iniciar o servidor em modo de desenvolvimento com respostas mockadas, utilize o script fornecido:

```bash
./start-dev-server.sh
```

Este script verifica automaticamente se a porta 3000 está em uso e, caso esteja, utiliza a porta 3000. Também define as variáveis de ambiente necessárias para o modo de desenvolvimento com respostas mockadas.

## Implementação Técnica

A implementação da API de NCM utiliza o `TokenTracker` para monitorar o uso de tokens em cada consulta, permitindo a análise de custos e otimização do uso dos modelos de IA.

A API possui um mecanismo de fallback que tenta outros modelos disponíveis caso o modelo principal falhe, garantindo maior resiliência ao serviço.

## Próximos Passos

- Implementação de cache para consultas frequentes
- Adição de estatísticas de uso por modelo
- Integração com sistema de logs centralizado
