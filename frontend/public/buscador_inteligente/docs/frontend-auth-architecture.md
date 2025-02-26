# Documentação do Sistema de Login

### Resumo dos Arquivos

- **SupabaseClient.tsx**  
  Configura o cliente do Supabase com a URL e a `anon_key`.

- **SessionContext.tsx**  
  Gerencia o contexto de sessão:
  - Valida sessões salvas no `localStorage`.
  - Oferece um *hook* para acessar o estado da sessão.
  - Fornece o `SessionProvider` para encapsular componentes.

- **PrivateRoute.tsx**  
  Protege rotas verificando a validade da sessão:
  - Se válida, renderiza o componente filho.
  - Caso contrário, redireciona para a página de login.

- **Login.tsx**  
  Renderiza a interface de login.

- **App.tsx**  
  Define as rotas da aplicação, protegendo algumas com `PrivateRoute`.

- **main.tsx**  
  Arquivo principal que encapsula o `App` dentro do `SessionProvider`.

### Lógica do Sistema

1. **SupabaseClient** inicializa o cliente do Supabase.  
2. **SessionContext** usa o cliente para gerenciar a sessão e fornecer acesso via contexto.  
3. **main.tsx** encapsula o `App` no `SessionProvider`.  
4. **App.tsx** organiza as rotas, protegendo-as com `PrivateRoute` quando necessário.  
5. **PrivateRoute** verifica a sessão e controla o acesso às rotas protegidas.  