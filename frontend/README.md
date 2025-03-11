# CMEX Frontend

Interface de usuário para o sistema CMEX, desenvolvida com React, TypeScript e Tailwind CSS.

## Funcionalidades Principais

- Interface de chat intuitiva para consultas
- Exibição em tempo real do progresso da pesquisa
- Renderização de vários tipos de mensagens
- Exibição de referências e fontes
- Indicador visual de status da conexão

## Estrutura do Projeto

```
frontend/
├── public/             # Recursos estáticos
├── src/
│   ├── components/     # Componentes React
│   ├── context/        # Contextos React
│   ├── hooks/          # Hooks personalizados
│   ├── pages/          # Páginas da aplicação
│   ├── types/          # Definições de tipos
│   ├── utils/          # Utilitários
│   │   └── sseClient.ts # Cliente SSE para comunicação em tempo real
│   └── __tests__/      # Testes e documentação
│       ├── document_sse_flow.js            # Documenta o fluxo SSE
│       ├── simulate_chat_message_tests.js  # Documenta testes do ChatMessage
│       ├── generate_final_report.js        # Gera o relatório final
│       ├── run_documentation.sh            # Script para gerar documentação
│       └── README.md                       # Informações sobre testes
└── test-reports/       # Relatórios gerados
    └── evidence/       # Evidências documentadas
```

## Pré-requisitos

- Node.js (versão 16.x ou superior)
- npm ou yarn

## Instalação

```bash
cd frontend
npm install
```

## Execução

### Ambiente de Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Build de Produção

```bash
npm run build
```

Os arquivos serão gerados no diretório `dist/`.

## Fluxo SSE

A aplicação utiliza Server-Sent Events (SSE) para comunicação em tempo real com o backend. O fluxo de dados funciona da seguinte forma:

1. O usuário envia uma pergunta
2. O frontend estabelece uma conexão SSE com o backend
3. O backend envia eventos em tempo real (progresso, pesquisa, raciocínio, resposta)
4. O frontend renderiza esses eventos em componentes específicos

A documentação completa deste fluxo está disponível em:

```bash
# Gerar documentação detalhada do fluxo SSE
cd frontend
./src/__tests__/run_documentation.sh
```

Os relatórios gerados estarão em `test-reports/evidence/`.

## Desenvolvimento

### Convenções de Código

- Use TypeScript estrito para todas as implementações
- Siga o padrão de componentes funcionais com hooks
- Utilize o Context API para estado global
- Use CSS Modules ou Tailwind para estilização

### Testes

A documentação detalhada dos testes e análise de comportamento pode ser gerada com:

```bash
cd frontend
./src/__tests__/run_documentation.sh
```

Este comando gera:

- Documentação do fluxo SSE
- Documentação simulada de testes do ChatMessage
- Relatório final consolidado

## Integração com Backend

A aplicação se comunica com o backend através de:

1. API REST para solicitações síncronas
2. Server-Sent Events para comunicação em tempo real

O endpoint SSE é `/api/v1/stream/{requestId}`, onde `requestId` é um identificador único gerado para cada conversa.
