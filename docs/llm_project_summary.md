# Sumário do Projeto CMEX para LLMs

## Objetivo deste Sumário

Este documento serve como índice organizado para modelos de linguagem navegarem pela documentação e estrutura do projeto CMEX. O formato estruturado permite que LLMs (Large Language Models) compreendam rapidamente o ecossistema do projeto, seus componentes e a documentação disponível.

## Metadados do Projeto

```json
{
  "project_name": "CMEX POC",
  "version": "1.0.0",
  "components": [
    { "name": "frontend", "type": "React/TypeScript", "path": "/frontend" },
    { "name": "fastapi", "type": "Python/FastAPI", "path": "/fastapi" },
    {
      "name": "buscador_inteligente",
      "type": "Node.js/TypeScript",
      "path": "/buscador_inteligente"
    },
    {
      "name": "node-DeepResearch-jina",
      "type": "Node.js/TypeScript",
      "path": "/node-DeepResearch-jina"
    },
    { "name": "shared-types", "type": "TypeScript", "path": "/shared-types" }
  ],
  "integrations": [
    { "service": "Redis", "purpose": "Comunicação entre serviços" },
    { "service": "SSE", "purpose": "Atualizações em tempo real" }
  ],
  "documentation_updated": "Março 2025"
}
```

## Índice de Documentação

| Documento                                                          | Tipo        | Propósito                    | Estrutura            | Atualizado |
| ------------------------------------------------------------------ | ----------- | ---------------------------- | -------------------- | ---------- |
| [ambiente.md](#ambiente)                                           | Guia        | Configuração de ambiente     | Linear/Instruções    | ✅         |
| [analise_comparativa.md](#analise_comparativa)                     | Análise     | Comparação de modelos        | Tabelas/Texto        | ✅         |
| [analise_comparativa_agents.md](#analise_comparativa_agents)       | Análise     | Comparação de agentes        | Tabelas/Texto        | ✅         |
| [comunicacao_microservicos.md](#comunicacao_microservicos)         | Técnico     | Implementação de comunicação | Código/Diagramas     | ✅         |
| [estructura_projeto_integracao.md](#estructura_projeto_integracao) | Arquitetura | Estrutura de integração      | Diagramas/JSONs      | ✅         |
| [guia-usuario.md](#guia_usuario)                                   | Guia        | Manual do usuário            | Instruções           | ✅         |
| [implementacao_redis.md](#implementacao_redis)                     | Técnico     | Detalhes do Redis            | Código/Explicações   | ✅         |
| [IMPLEMENTATION_STEPS.md](#implementation_steps)                   | Plano       | Etapas de implementação      | Checklist            | ✅         |
| [IMPLEMENTATION_SUMMARY.md](#implementation_summary)               | Resumo      | Status do projeto            | Seções de texto      | ✅         |
| [plano_integracao_ferramentas.md](#plano_integracao_ferramentas)   | Plano       | Integração de ferramentas    | Fases/Diagramas      | ⚠️         |
| [swagger.md](#swagger)                                             | Técnico     | Documentação API             | Instruções/Endpoints | ✅         |
| [testes.md](#testes)                                               | Técnico     | Estratégia de testes         | Instruções/Exemplos  | ✅         |
| [README-extractor.md](#readme_extractor)                           | Guia        | Documentação de extratores   | Instruções           | ✅         |

## Documentos de Referência JSON (Gerados)

| Arquivo JSON                        | Gerado Por                        | Conteúdo             | Tamanho Aprox. |
| ----------------------------------- | --------------------------------- | -------------------- | -------------- |
| fastapi_reference.json              | fastapi_extractor.py              | API FastAPI          | 274KB          |
| frontend_reference.json             | frontend_extractor.js             | Frontend React       | 1.0MB          |
| node_deepresearch_reference.json    | node_deepresearch_extractor.js    | DeepResearch Node.js | 10MB           |
| buscador_inteligente_reference.json | buscador_reference_extractor.js   | Buscador Inteligente | 299KB          |
| deepsearch_ui_reference.json        | deepsearch_reference_extractor.js | DeepSearch UI        | 154KB          |

## Estrutura do Projeto

```
cmex_poc/
├── frontend/                # Aplicação React/TypeScript
├── fastapi/                 # API Python/FastAPI
├── buscador_inteligente/    # Servidor Node.js principal
├── node-DeepResearch-jina/  # Serviço DeepResearch
├── shared-types/            # Tipos compartilhados
├── docs/                    # Documentação
└── .env                     # Variáveis de ambiente
```

## Descrições de Documentos

<a id="ambiente"></a>

### ambiente.md

Guia de configuração do ambiente de desenvolvimento. Inclui instruções para configurar o frontend, backend FastAPI, buscador inteligente e Redis. Contém seções sobre variáveis de ambiente, verificação da instalação e solução de problemas comuns.

<a id="analise_comparativa"></a>

### analise_comparativa.md

Análise comparativa dos modelos de IA usados para classificação fiscal. Inclui comparação detalhada entre GPT-4, Claude, DeepSeek, Qwen e Gemini, com métricas de precisão, tempo de resposta e custo.

<a id="analise_comparativa_agents"></a>

### analise_comparativa_agents.md

Comparação entre diferentes implementações de agentes de IA, incluindo estruturas, benefícios e casos de uso. Analisa abordagens de agentes em relação ao projeto CMEX.

<a id="comunicacao_microservicos"></a>

### comunicacao_microservicos.md

Documento técnico detalhando a implementação da comunicação entre o frontend, FastAPI e Node.js. Foca especialmente na infraestrutura Redis Pub/Sub e SSE para comunicação assíncrona. Inclui exemplos de código e diagramas.

<a id="estructura_projeto_integracao"></a>

### estructura_projeto_integracao.md

Arquitetura detalhada do projeto de integração, incluindo diagramas Mermaid, estrutura de monorepo proposta, e formatos JSON unificados. Inclui propostas para adaptar recursos do node-DeepResearch-jina.

<a id="guia_usuario"></a>

### guia-usuario.md

Manual do usuário detalhando como utilizar a plataforma CMEX, incluindo consulta de NCM, modo DeepResearch, atualizações em tempo real e histórico de consultas. Inclui seção de solução de problemas comuns.

<a id="implementacao_redis"></a>

### implementacao_redis.md

Documento técnico sobre a implementação da comunicação via Redis, incluindo serviços para Node.js e FastAPI, integração com Server-Sent Events, e descrição de erros encontrados e correções. Lista também o que ainda precisa ser feito.

<a id="implementation_steps"></a>

### IMPLEMENTATION_STEPS.md

Plano detalhado de implementação em etapas, com status atual (~90% completo), checklist de tarefas concluídas e pendentes, e descrição de cada fase do desenvolvimento.

<a id="implementation_summary"></a>

### IMPLEMENTATION_SUMMARY.md

Resumo do estado atual do projeto, destacando componentes implementados, melhorias recentes e próximos passos. Foca nos componentes de interface e comunicação em tempo real.

<a id="plano_integracao_ferramentas"></a>

### plano_integracao_ferramentas.md

Plano de integração de ferramentas ao buscador inteligente via MCP, incluindo fases de implementação, diagramas de fluxo, exemplos de código e comparação de formatos JSON. Documento de referência para o plano de implementação.

<a id="swagger"></a>

### swagger.md

Guia para acessar e utilizar a documentação interativa Swagger para as APIs do projeto. Lista endpoints principais e explica como testar APIs, incluindo endpoints SSE.

<a id="testes"></a>

### testes.md

Documentação de testes de modelos de IA para classificação fiscal, incluindo metodologia, execução, interpretação de resultados e testes específicos para integração SSE e Redis.

<a id="readme_extractor"></a>

### README-extractor.md

Documentação sobre os extratores de código que geram arquivos JSON de referência. Explica como cada extrator funciona, como usá-los e para que servem os arquivos gerados.

## Extratores de Código

Os extratores são scripts que analisam o código-fonte e geram documentação estruturada em JSON:

```json
{
  "extratores": [
    {
      "nome": "fastapi_extractor.py",
      "linguagem": "Python",
      "analisa": "API FastAPI",
      "gera": "fastapi_reference.json",
      "comando": "cd fastapi && python fastapi_extractor.py"
    },
    {
      "nome": "frontend_extractor.js",
      "linguagem": "JavaScript",
      "analisa": "Frontend React/TypeScript",
      "gera": "frontend_reference.json",
      "comando": "cd frontend && node frontend_extractor.js"
    },
    {
      "nome": "node_deepresearch_extractor.js",
      "linguagem": "JavaScript",
      "analisa": "DeepResearch Node.js",
      "gera": "node_deepresearch_reference.json",
      "comando": "cd node-DeepResearch-jina && node ../docs/node_deepresearch_extractor.js ."
    },
    {
      "nome": "buscador_reference_extractor.js",
      "linguagem": "JavaScript",
      "analisa": "Buscador Inteligente",
      "gera": "buscador_inteligente_reference.json",
      "comando": "cd buscador_inteligente && node ../docs/buscador_reference_extractor.js ."
    }
  ]
}
```

## Componentes Principais

### Frontend (React/TypeScript)

- Implementa a interface do usuário
- Gerencia o estado da aplicação com React hooks
- Comunica com backend via APIs REST
- Recebe atualizações em tempo real via SSE
- Componentes principais: `Chat`, `ChatMessage`, `DeepResearchProgress`, `ConnectionIndicator`

### FastAPI (Python)

- Processa consultas de classificação fiscal
- Integração com modelos de IA (GPT-4, Claude, Gemini, etc.)
- Comunica com Node.js via Redis
- Endpoints: `/api/v1/query`, `/api/v1/query-status`, `/api/v1/queries`, etc.

### Buscador Inteligente (Node.js)

- Gerencia conexões SSE para atualizações em tempo real
- Implementa a lógica de pesquisa aprofundada (DeepResearch)
- Comunica com FastAPI via Redis
- Endpoints: `/api/v1/sse/connect/{requestId}`, `/api/v1/stream/{requestId}`, etc.

### Redis

- Middleware de comunicação assíncrona entre serviços
- Implementa padrão Pub/Sub para mensagens entre serviços
- Canais principais: `node:task_updates`, `fastapi:task_updates`, `model:selection`

## Relações entre Componentes

```
Frontend (React) <--HTTP/REST--> Buscador Inteligente (Node.js) <--Redis Pub/Sub--> FastAPI (Python)
        ^                               |
        |                               v
        +------------SSE-----------------+
```

## Padrões Técnicos Relevantes

1. **SSE (Server-Sent Events)**: Implementado para comunicação em tempo real
2. **Redis Pub/Sub**: Utilizado para comunicação assíncrona entre serviços
3. **TypeScript**: Usado para tipagem estática nos componentes JavaScript
4. **Pydantic**: Usado para validação de dados no FastAPI
5. **React Hooks**: Utilizados para gerenciamento de estado no frontend
6. **Mermaid**: Usado para diagramas em markdown

## Instruções para Uso por LLMs

1. **Contexto Técnico**: Foque nas informações dos documentos JSON para entender detalhes de implementação
2. **Visão Geral**: Utilize os documentos MD para entender a arquitetura e fluxos
3. **Navegação**: Use os IDs de âncora para navegar diretamente para seções específicas
4. **Referências Cruzadas**: Relacione os componentes descritos em vários documentos
5. **Extratores**: Entenda que os arquivos JSON de referência são gerados pelos extratores e não devem ser editados manualmente

Este sumário deve ser atualizado quando novos documentos forem adicionados ou modificações significativas forem feitas no projeto.
