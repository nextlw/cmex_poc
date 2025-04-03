# Regras de Implementação - Arquitetura MCP

**IMPORTANTE: Regras de implementação a serem seguidas rigorosamente no desenvolvimento do projeto MCP**

## Estrutura e Organização

1. **Tipos e Schemas:**

   - Todos os tipos compartilhados DEVEM ser definidos em `shared/types/`
   - Todos os schemas Zod DEVEM ser definidos em `shared/schemas/`
   - Interfaces específicas de componentes DEVEM ser armazenadas no arquivo `types.ts` na pasta do respectivo componente
   - Tipos de contextos MCP DEVEM herdar da interface base `MCPContext<T>`

2. **Estrutura de Componentes:**

   ```
   mcp/client/src/components/PastaComNomeDoComponente/
                                                    |
                                                    |__index.tsx
                                                    |__styles.css
                                                    |__types.ts
   ```

3. **Contextos MCP:**

   - Contextos DEVEM ser organizados por domínio em `mcp/client/src/contexts/`
   - Cada contexto DEVE ter um provider React correspondente
   - Cada contexto DEVE ter um hook personalizado para uso pelos componentes
   - Context Handlers no servidor DEVEM corresponder 1:1 com os contextos do cliente

4. **Monorepo e Importações:**
   - NÃO importar diretamente entre workspaces sem usar aliases configurados
   - Usar apenas pnpm para gerenciamento de pacotes
   - NUNCA duplicar tipos ou utils entre workspaces

## Implementação

5. **Cliente MCP:**

   - Componentes DEVEM usar o hook `useMCPClient` para comunicação com o servidor
   - Componentes NÃO DEVEM fazer requisições HTTP diretas - SEMPRE usar o protocolo MCP
   - Estilos e tokens visuais DEVEM ser consumidos exclusivamente do arquivo `tokens.css`
   - Implementações de estado global DEVEM usar Context API junto com o hook `useMCPClient`

6. **Servidor MCP:**

   - Implementação de novas ferramentas (`tools/`) só pode acontecer após autorização do usuário com a mensagem específica "mcpToolImplement"
   - Validação com Zod é OBRIGATÓRIA para todos os contextos recebidos
   - Handlers DEVEM ser desacoplados - um handler não deve depender diretamente de outro
   - Agentes DEVEM receber o `ModelRegistry` por injeção de dependência

7. **Modelos de IA:**
   - NUNCA hardcode de chaves de API ou URLs de endpoints
   - SEMPRE usar o `ModelRegistry` para instanciar modelos
   - IMPLEMENTAR fallbacks para casos de falha do modelo primário
   - Rastrear uso de tokens e custos usando `TokenTracker` em `shared/utils/`

## Processo de Desenvolvimento

8. **Antes de Implementar:**

   - Ler a documentação relevante na pasta `docs/`
   - Analisar os schemas Zod e tipos TypeScript relacionados
   - Verificar os contextos MCP existentes relacionados
   - Identificar os agentes e ferramentas necessários

9. **Durante o Desenvolvimento:**

   - Implementação deve ser completa e erros corrigidos antes do término da tarefa
   - Testes unitários são OBRIGATÓRIOS para handlers, agentes e ferramentas
   - Seguir convenções existentes de nomes e estrutura
   - Documentar novos contextos MCP na pasta `docs/`

10. **Docker e Deploy:**

    - NÃO modificar Dockerfiles sem autorização específica
    - SEMPRE testar localmente com `docker-compose up` antes de submeter alterações
    - Configurações específicas do ambiente DEVEM ser via variáveis de ambiente
    - Senhas e chaves de API DEVEM ser referenciadas via Azure Key Vault em produção

11. **Workspaces:**
    - `shared/`: Tipos, schemas, constantes e utils compartilhados
    - `mcp/client/`: Código front-end React
    - `mcp/server/`: Código back-end Node.js
    - Código Python SOMENTE permitido em módulos legados na pasta `fastapi/` até migração completa

**IMPORTANTE: Essas regras visam manter a integridade da arquitetura MCP e garantir um desenvolvimento consistente.**
