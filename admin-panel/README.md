# Painel de Administração CMEX

Painel para gerenciamento dos serviços locais do projeto CMEX.

## Funcionalidades

- Gerenciamento de serviços locais (Redis, FastAPI, Node.js e Frontend)
- Iniciar/parar serviços individualmente
- Iniciar/parar todos os serviços
- Visualização de logs
- Interface com tema escuro

## Pré-requisitos

- Node.js 16+
- PNPM

## Instalação

1. Clone o repositório (se ainda não o fez)
2. Navegue até o diretório do painel de administração:

```bash
cd admin-panel
```

3. Instale as dependências:

```bash
pnpm install
```

## Execução

Para iniciar o painel de administração:

```bash
pnpm start
```

A aplicação será aberta automaticamente no navegador em `http://localhost:3000`.

## Estrutura do Projeto

```
admin-panel/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── services/       # Lógica de gerenciamento de serviços
│   ├── styles/         # Estilos globais e temas
│   ├── App.js          # Componente principal
│   └── index.js        # Ponto de entrada
├── public/             # Arquivos estáticos
└── package.json        # Dependências e scripts
```

## Serviços Gerenciados

- **Redis**: Serviço de armazenamento em memória para comunicação entre microserviços
- **FastAPI Backend**: API principal do CMEX
- **Node.js Backend**: Serviço de busca inteligente
- **Frontend React**: Interface web do CMEX
