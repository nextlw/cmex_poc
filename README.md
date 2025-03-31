# CMEX - Documentação Centralizada

## Visão Geral

CMEX é uma plataforma completa para consulta e classificação de NCM (Nomenclatura Comum do Mercosul) utilizando inteligência artificial. O sistema é composto por três componentes principais:

1. **Frontend**: Interface de usuário construída em React/TypeScript
2. **Backend (FastAPI)**: API REST para gerenciamento de usuários e integração
3. **Buscador Inteligente**: Motor de IA para processamento de consultas NCM

## Documentação Unificada

### Documentação de API (Swagger)

- [API FastAPI](http://localhost:10000/api/docs) - Documentação interativa da API principal
- [API Buscador Inteligente](http://localhost:3001/api/docs) - Documentação interativa do motor de IA

### Documentação por Componente

#### Frontend

- [Documentação Completa](./frontend/DOCS.md) - Guia detalhado do frontend
- [Guia de Componentes](./frontend/src/components/README.md) - Documentação dos componentes React
- [Sistema de Tipos](./frontend/src/types/README.md) - Documentação do sistema de tipos TypeScript

#### Backend (FastAPI)

- [Documentação da API](./fastapi/README.md) - Guia detalhado da API FastAPI
- [Modelos de Dados](./fastapi/app/models/README.md) - Documentação dos modelos de dados
- [Rotas da API](./fastapi/app/routes/README.md) - Documentação das rotas disponíveis

#### Buscador Inteligente

- [Documentação da API](./buscador_inteligente/API_DOCUMENTATION.md) - Documentação da API do buscador
- [Modelos de IA](./buscador_inteligente/docs/MODELOS_IA.md) - Documentação dos modelos de IA utilizados
- [Implementação](./buscador_inteligente/docs/IMPLEMENTACAO.md) - Detalhes de implementação
- [DeepResearch](./buscador_inteligente/docs/DEEP_RESEARCH_IMPLEMENTATION.md) - Documentação do modo DeepResearch

## Guias de Desenvolvimento

- [Configuração do Ambiente](./docs/ambiente.md) - Como configurar o ambiente de desenvolvimento
- [Fluxo de Trabalho](./docs/workflow.md) - Fluxo de trabalho e padrões de desenvolvimento
- [Testes](./docs/testes.md) - Guia de testes e validação de modelos de IA
- [Swagger](./docs/swagger.md) - Guia de utilização da documentação Swagger

## Guias de Uso

- [Guia do Usuário](./docs/guia-usuario.md) - Como utilizar a plataforma CMEX
- [FAQ](./docs/faq.md) - Perguntas frequentes
- [Troubleshooting](./docs/troubleshooting.md) - Solução de problemas comuns

## Configuração do Swagger

Para acessar a documentação interativa Swagger:

1. Inicie o servidor FastAPI:

   ```bash
   cd fastapi
   python -m uvicorn app.main:app --reload --port 10000
   ```

2. Inicie o servidor do Buscador Inteligente:

   ```bash
   cd buscador_inteligente
   ./start-dev-server.sh
   ```

3. Acesse as URLs:
   - FastAPI Swagger: http://localhost:10000/api/docs
   - Buscador Inteligente Swagger: http://localhost:3001/api/docs

## Contribuição

Consulte o [guia de contribuição](./docs/contribuicao.md) para informações sobre como contribuir com o projeto.

# CMEX POC - Painel de Controle de Serviços

Este repositório contém uma implementação de prova de conceito (POC) para o sistema CMEX, que integra diferentes serviços para oferecer uma solução de busca inteligente.

## Serviços Disponíveis

O projeto é composto pelos seguintes serviços:

1. **Buscador Inteligente**: API backend principal que fornece a funcionalidade de busca inteligente e processamento de dados.
2. **Node DeepResearch Jina**: Serviço complementar para pesquisa profunda e processamento de consultas complexas.
3. **DeepSearch UI Jina**: Interface web para visualizar e interagir com o serviço de pesquisa profunda Jina.
4. **Admin Panel Next**: Painel de administração construído com Next.js para gerenciamento e monitoramento do sistema.
5. **Frontend**: Interface de usuário principal para interação com os serviços.

## Inicialização dos Serviços

Todos os serviços são agora gerenciados através do Admin Panel Next, que oferece uma interface gráfica para controlar cada componente do sistema.

### Como usar o Painel de Controle

1. Abra um terminal na raiz do projeto
2. Execute o comando:

```bash
./start-panel.sh
```

O script irá:

- Verificar as dependências necessárias
- Iniciar o Admin Panel Next na porta 3200
- Abrir o navegador com a interface de administração

A partir da interface do Admin Panel Next, você poderá:

- Iniciar e parar cada serviço individualmente
- Visualizar logs de cada componente
- Monitorar o status e a porta de cada serviço
- Realizar a limpeza de portas em uso

### Estrutura de Portas

O sistema utiliza as seguintes portas por padrão:

- **Redis**: 6378
- **FastAPI**: 10000
- **Buscador Inteligente**: 3001-3003
- **Node DeepResearch Jina**: 3100-3103
- **DeepSearch UI Jina**: 3300-3303
- **Admin Panel Next**: 3200
- **Frontend**: 5173

## Gestão Manual (Alternativa)

Caso precise iniciar serviços individualmente sem o Admin Panel:

**Buscador Inteligente:**

```bash
cd buscador_inteligente
./start-dev-server.sh
```

**Node DeepResearch Jina:**

```bash
cd node-DeepResearch-jina
./start-dev-server.sh
```

**DeepSearch UI Jina:**

```bash
cd deepsearch-ui-jina
./start-dev-server.sh
```

**Admin Panel Next:**

```bash
cd admin-panel-next
npm run dev
```

## Comunicação entre Serviços

Os serviços são configurados para se comunicarem automaticamente através de suas respectivas APIs. O serviço de frontend se comunica com o Buscador Inteligente, enquanto o DeepSearch UI Jina se comunica com o Node DeepResearch Jina quando necessário. O Admin Panel Next controla e monitora todos os serviços em execução.
