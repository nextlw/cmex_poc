# Plano de Migração para Arquitetura MCP Unificada

Este documento descreve um plano passo-a-passo para migrar os projetos existentes (`admin-panel-next`, `buscador_inteligente`, `deepsearch-ui-nexcode`, `fastapi`, `frontend`, `node-DeepResearch-nexcode`) para uma arquitetura unificada baseada no Message Context Protocol (MCP). O objetivo é centralizar o código, utilizar a biblioteca `ai` e Zod para tipos e validação, implementar um registro flexível de modelos de IA e preparar a aplicação para deploy em contêineres Docker no Azure.

**Tecnologias Chave:**

- TypeScript
- React (para o cliente MCP)
- Node.js (para o servidor MCP)
- WebSocket (para comunicação MCP)
- Zod (para validação de schemas)
- Vercel AI SDK (`ai` library)
- Docker
- Azure (para deploy)

**Estrutura Alvo:**

```
cmex-poc/
├── mcp/
│   ├── client/
│   │   ├── src/
│   │   │   ├── contexts/
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   ├── services/ (MCPClient, WebSocketService)
│   │   │   └── App.tsx / main.tsx (Entrypoint)
│   │   ├── public/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── server/
│       ├── src/
│       │   ├── contexts/ (Handlers: Search, Admin, Research, etc.)
│       │   ├── agents/ (SearchAgent, AdminAgent, ResearchAgent)
│       │   ├── tools/ (NCMTool, DeepResearchTool, ValidationTool, etc.)
│       │   ├── services/ (MCPServer, WebSocketService, RedisService, ModelRegistry)
│       │   ├── config/ (Configuração de modelos, env vars)
│       │   └── server.ts (Entrypoint)
│       ├── package.json
│       └── tsconfig.json
│
├── shared/
│   ├── types/ (core.ts, ai.ts, tax.ts, api.ts, ui.ts, context.ts, etc.)
│   ├── schemas/ (Zod schemas correspondentes aos tipos)
│   ├── constants/ (mcp.ts, endpoints.ts)
│   └── utils/ (token-tracker.ts, parsers.ts)
│
├── docker/
│   ├── mcp-client/
│   │   └── Dockerfile
│   ├── mcp-server/
│   │   └── Dockerfile
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/ (CI/CD para Azure)
│
├── package.json         # Raiz (para workspaces, se usar pnpm/yarn)
├── tsconfig.base.json   # Config base do TypeScript
└── migration_plan.md    # Este arquivo
```

---

## Plano de Implementação (Prompts Sequenciais)

**Instrução:** Execute os prompts a seguir em sequência. Cada prompt assume que o anterior foi concluído com sucesso.

---

**Prompt 1: Configuração Inicial da Estrutura e Workspaces**

```text
Tarefa: Configure a estrutura de diretórios base para o monorepo MCP conforme descrito acima. Inicialize um gerenciador de pacotes com suporte a workspaces (como pnpm ou yarn workspaces) na raiz do projeto (`cmex-poc/`). Crie os arquivos `package.json` iniciais para a raiz, `mcp/client`, `mcp/server` e `shared`. Configure também um `tsconfig.base.json` na raiz para configurações TypeScript compartilhadas e `tsconfig.json` básicos para cada workspace (client, server, shared) que estendam o base.

Diretórios a criar:
- mcp/client/src/{contexts,hooks,components,services}
- mcp/client/public
- mcp/server/src/{contexts,agents,tools,services,config}
- shared/{types,schemas,constants,utils}
- docker/mcp-client
- docker/mcp-server
- .github/workflows

Arquivos a criar/configurar:
- /package.json (raiz com config de workspaces)
- /tsconfig.base.json
- mcp/client/package.json
- mcp/client/tsconfig.json
- mcp/server/package.json
- mcp/server/tsconfig.json
- shared/package.json
- shared/tsconfig.json
```

---

**Prompt 2: Definição dos Tipos Compartilhados com Zod e `ai`**

```text
Tarefa: Com base no exemplo fornecido anteriormente e nos tipos existentes nos projetos (`frontend/src/types/index.ts`, `buscador_inteligente/src/types/globalTypes.ts`, etc.), crie os arquivos de tipos e schemas Zod no diretório `shared/`.

Arquivos a criar/popular em `shared/types/` e `shared/schemas/`:
1.  `shared/types/core.ts`: Defina tipos e schemas Zod básicos como `ReferenceSchema`, `ContentBlockSchema`.
2.  `shared/types/ai.ts`: Defina tipos e schemas Zod relacionados à interação com IA, como `ActionSchema`, `KnowledgeItemSchema`, e as extensões para os tipos da biblioteca `ai` (`ExtendedMessage`, etc.).
3.  `shared/types/tax.ts`: Defina tipos e schemas Zod específicos para dados tributários, como `TipoTributarioSchema`, `ValoresImpostosSchema`, `ClassificacaoTributariaSchema`, `SugerirNCMSchema`.
4.  `shared/types/api.ts`: Defina tipos e schemas Zod para payloads e respostas de API (que agora serão contextos MCP), como `QuerySchema`, `TaskResultSchema`, `LogsResponseSchema`.
5.  `shared/types/ui.ts`: Defina tipos e schemas Zod para estados e componentes de UI, como `LoadingStateSchema`, `AutocompleteTypeSchema`.
6.  `shared/types/context.ts`: Defina a interface base `MCPContext<T>` e tipos específicos para cada contexto que será trocado via WebSocket (ex: `SearchContextData`, `SearchResultContextData`, `AdminActionContextData`, etc.). Use os tipos definidos nos outros arquivos como `data` para esses contextos.
7.  `shared/schemas/`: Crie arquivos Zod correspondentes (ex: `search.schema.ts`) para validação dos `data` dos contextos MCP.

Instrução Adicional: Certifique-se de que os schemas Zod sejam exportados para que possam ser usados para validação no servidor e, potencialmente, no cliente. Adicione as dependências `zod` e `ai` ao `shared/package.json`. Migre utilitários relevantes como `token-tracker.ts` para `shared/utils/`.
```

---

**Prompt 3: Implementação do Core do Servidor MCP (WebSocket)**

```text
Tarefa: Implemente a classe base `MCPServer` em `mcp/server/src/services/MCPServer.ts`. Esta classe deve:
1.  Utilizar a biblioteca `ws` para criar um servidor WebSocket.
2.  Gerenciar conexões de clientes.
3.  Receber mensagens (esperando JSON que valide como `MCPContext`).
4.  Ter um mecanismo para registrar `handlers` baseados no `context.type`.
5.  Chamar o handler apropriado ao receber um contexto.
6.  Enviar a resposta (outro `MCPContext`) de volta ao cliente que enviou a mensagem original.
7.  Implementar validação básica usando os schemas Zod de `shared/schemas/` para os contextos recebidos.
8.  Adicionar logging básico para conexões, mensagens recebidas/enviadas e erros.
9.  Criar o entrypoint `mcp/server/src/server.ts` que instancia o `MCPServer`, registra os handlers (inicialmente vazios ou com stubs) e inicia o servidor.
10. Adicionar a dependência `ws` e `@types/ws` ao `mcp/server/package.json`.
```

---

**Prompt 4: Implementação do Core do Cliente MCP (WebSocket + React Hook)**

```text
Tarefa: Implemente a classe base `MCPClient` em `mcp/client/src/services/MCPClient.ts` e um hook React `useMCPClient` em `mcp/client/src/hooks/useMCPClient.ts`.
1.  `MCPClient`:
    - Deve usar a API `WebSocket` do navegador para conectar ao `MCPServer`.
    - Deve fornecer métodos para enviar `MCPContext` ao servidor.
    - Deve ter um mecanismo para registrar callbacks baseados no `context.type` das mensagens recebidas do servidor.
    - Deve gerenciar o estado da conexão (conectando, conectado, desconectado) e tentativas de reconexão.
2.  `useMCPClient`:
    - Deve fornecer uma instância singleton do `MCPClient` para a aplicação React.
    - Pode usar o React Context API para gerenciar a instância e o estado da conexão.
    - Deve expor métodos para enviar contextos e registrar handlers de forma fácil para os componentes.
3.  Adicionar as dependências `react` ao `mcp/client/package.json`.
```

---

**Prompt 5: Implementação do Registro e Seleção de Modelos de IA**

```text
Tarefa: Implemente um serviço `ModelRegistry` em `mcp/server/src/services/ModelRegistry.ts` e integre-o.
1.  `ModelRegistry`:
    - Deve carregar configurações de diferentes modelos de IA (OpenAI, Claude, Qwen, DeepSeek, Local - ex: Ollama/LM Studio) a partir de variáveis de ambiente ou um arquivo de configuração em `mcp/server/src/config/`. As configurações devem incluir API Keys, URLs base, nomes de modelos, etc.
    - Deve fornecer um método `getModelInstance(modelName: string)` que retorna uma instância configurada de um cliente para a API do modelo correspondente (usando bibliotecas como `openai`, `@anthropic-ai/sdk`, ou `fetch` para APIs locais/customizadas). Use a biblioteca `ai` (`createOpenAI`, `createAnthropic`, etc.) sempre que possível.
    - Deve lidar com erros de configuração (ex: API Key faltando).
2.  Integração:
    - Modifique os `Agents` (a serem criados no próximo passo) para receberem uma instância do `ModelRegistry`.
    - Quando um agente precisar chamar um modelo de IA, ele obterá a instância do modelo apropriado do `ModelRegistry` com base em um parâmetro `model` vindo do `MCPContext` da requisição (ou um modelo padrão).
    - Adicione as dependências necessárias (ex: `openai`, `@anthropic-ai/sdk`) ao `mcp/server/package.json`.
```

---

**Prompt 6: Migração dos Agentes e Ferramentas (Core Logic)**

```text
Tarefa: Migre a lógica principal de `buscador_inteligente/src/agent.ts` e `node-DeepResearch-nexcode` para a nova estrutura de Agentes e Ferramentas no servidor MCP.
1.  Analise `buscador_inteligente/src/agent.ts`. Identifique os diferentes "Actions" (search, answer, reflect, etc.) e a lógica associada.
2.  Crie classes de Ferramentas em `mcp/server/src/tools/` para encapsular funcionalidades específicas (ex: `NCMTool.ts`, `DeepResearchTool.ts`, `WebSearchTool.ts`, `DatabaseTool.ts`). Essas ferramentas podem interagir com APIs externas, bancos de dados ou executar lógica complexa. Migre código relevante de `buscador_inteligente/src/tools/` e da lógica de `node-DeepResearch-nexcode`.
3.  Crie classes de Agentes em `mcp/server/src/agents/` (ex: `SearchAgent.ts`). Um agente orquestra o uso de múltiplas ferramentas para realizar uma tarefa mais complexa, definida por um contexto MCP. O agente recebe o `MCPContext`, usa o `ModelRegistry` para selecionar o modelo de IA, interage com as ferramentas necessárias e formata a resposta como um novo `MCPContext`.
4.  Refatore a lógica do `agent.ts` original para dentro do(s) agente(s) e ferramenta(s) apropriados. Utilize os tipos e schemas Zod definidos em `shared/`.
5.  Implemente os `Context Handlers` em `mcp/server/src/contexts/` (ex: `SearchContextHandler.ts`). Cada handler recebe um `MCPContext` específico do `MCPServer`, instancia o Agente apropriado, passa o contexto para o agente processar, e retorna o `MCPContext` resultante para o servidor enviar de volta ao cliente.
```

---

**Prompt 7: Migração do Frontend Principal (Busca)**

```text
Tarefa: Migre os componentes principais da interface do usuário de busca do projeto `frontend` para o `mcp/client/`.
1.  Analise `frontend/src/pages/HomePage/index.tsx` e componentes relacionados. Identifique os componentes de UI para entrada de busca, exibição de resultados, exibição de status/loading, etc.
2.  Recrie/mova esses componentes para `mcp/client/src/components/Search/`. Adapte-os para usar o hook `useMCPClient` para enviar contextos de busca (`SearchContext`) e receber/exibir resultados (`SearchResultContext`).
3.  Use os tipos definidos em `shared/types/ui.ts` e `shared/types/search.ts` para o estado do componente.
4.  Configure o entrypoint da aplicação React (`App.tsx` ou `main.tsx`) em `mcp/client/src/` para montar esses componentes e prover o contexto do `useMCPClient`.
```

---

**Prompt 8: Migração dos Frontends Adicionais (Admin, DeepSearch UI)**

```text
Tarefa: Migre as interfaces de usuário dos projetos `admin-panel-next`(/Users/williamduarte/Pesquisa_CMEX/cmex_poc/admin-panel-next)) e `deepsearch-ui-nexcode`(/Users/williamduarte/Pesquisa_CMEX/cmex_poc/deepsearch-ui-nexcode)) para o `mcp/client/`.
1.  Analise os componentes e a lógica de `admin-panel-next`. Recrie/mova a UI para `mcp/client/src/components/Admin/`. Defina os `MCPContext`s necessários (ex: `AdminActionContext`, `AdminStatusContext`) em `shared/types/` e `shared/schemas/`. Crie os handlers correspondentes no servidor (`mcp/server/src/contexts/admin/`) e um `AdminAgent` se necessário. Integre a UI do cliente com o `useMCPClient`.
2.  Analise `deepsearch-ui-nexcode`. Recrie/mova a UI para `mcp/client/src/components/Research/`. Defina os `MCPContext`s (ex: `StartResearchContext`, `ResearchUpdateContext`) em `shared/`, crie handlers no servidor (`mcp/server/src/contexts/research/`) e um `ResearchAgent`. Integre a UI com o `useMCPClient`.
3.  Considere como integrar essas diferentes seções (Busca, Admin, Pesquisa) na aplicação React principal do cliente (ex: usando roteamento).
```

---

# **_Prompt 9: Migração da Lógica do Backend FastAPI_**

```text
Tarefa: Migre a lógica relevante do backend `fastapi` para os handlers de contexto e serviços do `mcp/server/`.
1.  Analise as rotas em `fastapi/app/routes/` (queries, autocomplete, etc.) e os serviços em `fastapi/app/services/`.
2.  A lógica de processamento de queries (`/queries`) deve ser movida principalmente para o `SearchAgent` e `SearchContextHandler`.
3.  A lógica de autocomplete (`/autocomplete`) pode se tornar um novo contexto/handler (`AutocompleteContextHandler`) no servidor MCP ou ser integrada ao contexto de busca.
4.  A comunicação via Redis (`redis_service.py`) para atualização de status pode ser mantida ou substituída/complementada pela comunicação WebSocket do MCP. Se mantida, crie um `RedisService.ts` em `mcp/server/src/services/` e integre-o onde necessário (provavelmente no `ResearchAgent` ou `DeepResearchTool`).
5.  A lógica de autenticação (`auth_middleware.py`) precisa ser reimplementada no `MCPServer` ou em um gateway de API na frente dele. A autenticação pode ocorrer na conexão WebSocket inicial ou através de tokens passados nos `MCPContext`s. Decida a estratégia e implemente-a.
6.  Ignore as configurações de CORS e a própria estrutura de rotas HTTP do FastAPI, pois a comunicação será via WebSocket.
```

---

**Prompt 10: Dockerização da Aplicação**

```text
Tarefa: Crie os Dockerfiles para o cliente e o servidor MCP e um `docker-compose.yml` para desenvolvimento local.
1.  Crie `docker/mcp-client/Dockerfile`:
    - Use uma imagem base Node.js.
    - Copie os arquivos do workspace `mcp/client` e `shared`.
    - Instale dependências (usando `pnpm install --frozen-lockfile` se estiver usando pnpm).
    - Compile a aplicação React/Vite (`pnpm build`).
    - Use um servidor web leve (como `nginx` ou `serve`) para servir os arquivos estáticos compilados. Exponha a porta apropriada (ex: 3000).
2.  Crie `docker/mcp-server/Dockerfile`:
    - Use uma imagem base Node.js.
    - Copie os arquivos do workspace `mcp/server` e `shared`.
    - Instale dependências (`pnpm install --frozen-lockfile`).
    - Compile o código TypeScript (`pnpm build`).
    - Exponha a porta do servidor WebSocket (ex: 8080).
    - Defina o comando para iniciar o servidor Node (`node dist/server.js`).
3.  Crie `docker/docker-compose.yml`:
    - Defina serviços para `mcp-client`, `mcp-server` e `redis`.
    - Use os Dockerfiles criados.
    - Configure volumes para hot-reloading durante o desenvolvimento (opcional).
    - Defina a rede (`mcp-network`).
    - Passe variáveis de ambiente necessárias (URLs, chaves de API, config do Redis) para os contêineres.
```

---

**Prompt 11: Planejamento do Deploy no Azure**

```text
Tarefa: Descreva os passos e os serviços do Azure recomendados para fazer o deploy da aplicação MCP containerizada.
1.  **Container Registry:** Usar o Azure Container Registry (ACR) para armazenar as imagens Docker do `mcp-client` e `mcp-server`.
2.  **Aplicação:** Escolher um serviço de computação para rodar os contêineres:
    - **Azure App Service (Web App for Containers):** Mais simples para aplicações web e APIs. Suporta deploy direto do ACR, escalonamento automático, domínios customizados, SSL. Pode ser adequado se a complexidade de orquestração for baixa.
    - **Azure Kubernetes Service (AKS):** Mais poderoso e flexível para orquestração de contêineres. Ideal se você prevê escalabilidade complexa, microsserviços adicionais, ou precisa de controle fino sobre a rede e o deployment. Requer mais configuração inicial.
    - **Azure Container Instances (ACI):** Bom para rodar contêineres individuais rapidamente, talvez para tarefas específicas ou testes, mas menos adequado para a aplicação completa.
3.  **Banco de Dados/Cache:** Usar o Azure Cache for Redis para o serviço Redis. Se precisar de um banco de dados relacional ou NoSQL, considerar Azure SQL Database, Cosmos DB, etc.
4.  **Rede:** Configurar redes virtuais (VNets), Network Security Groups (NSGs) para controlar o tráfego entre os serviços e para o exterior.
5.  **Gerenciamento de Segredos:** Usar o Azure Key Vault para armazenar de forma segura as API Keys e outras informações sensíveis.
6.  **CI/CD:** Configurar um pipeline de CI/CD usando GitHub Actions (ou Azure DevOps):
    - **CI:** Buildar o código, rodar testes, buildar as imagens Docker e publicá-las no ACR a cada push/merge na branch principal.
    - **CD:** Disparar o deploy das novas imagens para o serviço de computação escolhido (App Service/AKS) após a CI ser bem-sucedida.
7.  **Monitoramento:** Integrar com o Azure Monitor e Application Insights para coletar logs, métricas e rastrear o desempenho da aplicação.
8.  **Gateway (Opcional):** Considerar o Azure API Management ou Application Gateway na frente do `mcp-server` para terminação SSL, roteamento, rate limiting, e potencialmente autenticação.
```

---

**Prompt 12: Revisão Final e README**

```text
Tarefa: Revise toda a estrutura de código criada. Verifique se as importações entre workspaces (`shared`, `client`, `server`) estão corretas. Certifique-se de que os tipos Zod estão sendo usados para validação no servidor. Crie um arquivo `README.md` na raiz do projeto descrevendo a nova arquitetura MCP, como configurar o ambiente de desenvolvimento (instalação de dependências, variáveis de ambiente necessárias) e como rodar a aplicação localmente usando `docker-compose up`.
```

---

Este plano fornece uma sequência lógica para a migração. Cada passo pode exigir iterações e ajustes conforme você avança na implementação. Boa sorte!
