# CMEX - Documentação Centralizada

## Visão Geral

CMEX é uma plataforma completa para consulta e classificação de NCM (Nomenclatura Comum do Mercosul) utilizando inteligência artificial. O sistema é composto por três componentes principais:

1. **Frontend**: Interface de usuário construída em React/TypeScript
2. **Backend (FastAPI)**: API REST para gerenciamento de usuários e integração
3. **Buscador Inteligente**: Motor de IA para processamento de consultas NCM

## Documentação Unificada

### Documentação de API (Swagger)

- [API FastAPI](http://localhost:10000/api/docs) - Documentação interativa da API principal
- [API Buscador Inteligente](http://localhost:3000/api/docs) - Documentação interativa do motor de IA

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
   - Buscador Inteligente Swagger: http://localhost:3000/api/docs

## Contribuição

Consulte o [guia de contribuição](./docs/contribuicao.md) para informações sobre como contribuir com o projeto.
