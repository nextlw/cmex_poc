# Extratores de Documentação do Projeto CMEX

Este diretório contém scripts extratores que analisam o código-fonte do projeto CMEX e geram documentação de referência em formato JSON.

## Extratores Disponíveis

O projeto possui quatro extratores principais:

1. **fastapi_extractor.py** - Analisa a API FastAPI e gera `fastapi_reference.json`
2. **frontend_extractor.js** - Analisa o frontend React/TypeScript e gera `frontend_reference.json`
3. **node_deepresearch_extractor.js** - Analisa o componente DeepResearch Node.js e gera `node_deepresearch_reference.json`
4. **buscador_reference_extractor.js** - Analisa o buscador inteligente e gera `buscador_inteligente_reference.json`

## Função dos Extratores

Cada extrator é responsável por analisar o código-fonte de uma parte específica do projeto, extraindo:

- Estrutura de diretórios e arquivos
- Componentes, funções e métodos
- Tipos e interfaces
- Rotas e endpoints de API
- Modelos de dados
- Hooks e utilitários
- Configurações
- Documentação em código

Os extratores usam análise estática de código (AST) para extrair informações precisas sem necessidade de executar o código.

## Como Usar os Extratores

### Extrator FastAPI (Python)

```bash
cd fastapi
python fastapi_extractor.py
```

### Extrator Frontend (JavaScript)

```bash
cd frontend
node frontend_extractor.js
```

### Extrator DeepResearch (JavaScript)

```bash
cd node-DeepResearch-jina
node ../docs/node_deepresearch_extractor.js .
```

### Extrator Buscador Inteligente (JavaScript)

```bash
cd buscador_inteligente
node ../docs/buscador_reference_extractor.js .
```

## Arquivos JSON Gerados

Os arquivos JSON gerados contêm documentação completa e estruturada para cada componente do sistema. Esses arquivos podem ser usados para:

1. Gerar documentação técnica
2. Facilitar a integração entre componentes
3. Realizar análises de dependências
4. Servir como referência para novos desenvolvedores
5. Acompanhar a evolução do projeto

## Contribuição

Ao fazer alterações significativas no código, execute novamente os extratores para atualizar a documentação de referência.
