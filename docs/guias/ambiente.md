# Configuração do Ambiente de Desenvolvimento

Este guia descreve como configurar o ambiente de desenvolvimento para o projeto CMEX.

## Pré-requisitos

- Node.js (v18+)
- Python (v3.10+)
- pnpm (v8+)
- Git
- Redis (v6+)

## Configuração do Frontend

1. Clone o repositório:

   ```bash
   git clone https://github.com/seu-usuario/cmex_poc.git
   cd cmex_poc
   ```

2. Instale as dependências do frontend:

   ```bash
   cd frontend
   pnpm install
   ```

3. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` com as configurações necessárias.

4. Inicie o servidor de desenvolvimento:
   ```bash
   pnpm run dev
   ```
   O frontend estará disponível em `http://localhost:5173`.

## Configuração do Backend (FastAPI)

1. Crie e ative um ambiente virtual Python:

   ```bash
   cd fastapi
   python -m venv venv
   source venv/bin/activate  # No Windows: venv\Scripts\activate
   ```

2. Instale as dependências:

   ```bash
   pip install -r requirements.txt
   ```

3. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` com as configurações necessárias, incluindo as variáveis do Redis:

   ```
   REDIS_HOST=localhost
   REDIS_PORT=6378
   REDIS_PASSWORD=
   REDIS_SSL=false
   ```

4. Inicie o servidor:
   ```bash
   python -m uvicorn app.main:app --reload --port 10000
   ```
   O backend estará disponível em `http://localhost:10000`.

## Configuração do Buscador Inteligente

1. Instale as dependências:

   ```bash
   cd buscador_inteligente
   pnpm install
   ```

2. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` com as configurações necessárias, incluindo as variáveis do Redis:

   ```
   REDIS_URL=redis://localhost:6378
   REDIS_PASSWORD=
   REDIS_TLS_URL=
   REDIS_SSL=false
   ```

3. Inicie o servidor:
   ```bash
   ./start-dev-server.sh
   ```
   Ou manualmente:
   ```bash
   pnpm run server
   ```
   O buscador inteligente estará disponível em `http://localhost:3001`.

## Configuração do Redis

1. Instale o Redis:

   **Ubuntu/Debian**:

   ```bash
   sudo apt update
   sudo apt install redis-server
   ```

   **macOS**:

   ```bash
   brew install redis
   ```

   **Windows**:
   Baixe o Redis para Windows em https://github.com/microsoftarchive/redis/releases

2. Inicie o serviço do Redis:

   **Linux/macOS**:

   ```bash
   redis-server
   ```

   **Windows**:
   Execute o arquivo `redis-server.exe`

3. Verifique se o Redis está funcionando:
   ```bash
   redis-cli ping
   ```
   Deve retornar `PONG`

## Configuração das Chaves de API

Para utilizar os modelos de IA, você precisará configurar as seguintes chaves de API:

- **OpenAI API Key**: Para modelos GPT
- **Google API Key**: Para modelos Gemini
- **Anthropic API Key**: Para modelos Claude
- **DeepSeek API Key**: Para modelos DeepSeek

Adicione estas chaves nos arquivos `.env` correspondentes.

## Verificação da Instalação

Para verificar se tudo está funcionando corretamente:

1. Acesse o frontend em `http://localhost:5173`
2. Verifique a documentação Swagger do FastAPI em `http://localhost:10000/api/docs`
3. Verifique a documentação Swagger do Buscador Inteligente em `http://localhost:3001/api/docs`
4. Teste a conexão com o Redis:
   ```bash
   redis-cli ping
   ```
5. Verifique se o Server-Sent Events (SSE) está funcionando acessando:
   ```
   http://localhost:3001/api/v1/sse/connect/test
   ```
   Você deverá ver uma conexão SSE estabelecida no console do navegador.

## Solução de Problemas Comuns

- **Erro de CORS**: Verifique se as origens permitidas estão configuradas corretamente nos arquivos de configuração.
- **Erro de conexão com API**: Verifique se os servidores backend estão em execução e se as URLs estão configuradas corretamente.
- **Erro de autenticação**: Verifique se as chaves de API estão configuradas corretamente.
- **Erro de conexão com Redis**: Verifique se o serviço Redis está em execução e se as configurações de conexão estão corretas nos arquivos `.env`.
- **Problemas com SSE**: Certifique-se de que não há firewalls ou proxies bloqueando conexões EventSource e verifique os logs do servidor para erros relacionados a conexões SSE.

## Teste do Sistema de Comunicação Assíncrona

Para verificar se o sistema de comunicação via Redis e SSE está funcionando:

1. Inicie todos os serviços (Frontend, FastAPI e Buscador Inteligente)
2. Acesse o frontend e faça uma consulta com a opção DeepResearch ativada
3. Observe o progresso da análise em tempo real na interface
4. Verifique os logs dos servidores para confirmar a comunicação entre eles

Se o progresso estiver sendo atualizado em tempo real na interface, a comunicação assíncrona está funcionando corretamente.
