# Configuração do Ambiente de Desenvolvimento

Este guia descreve como configurar o ambiente de desenvolvimento para o projeto CMEX.

## Pré-requisitos

- Node.js (v18+)
- Python (v3.10+)
- pnpm (v8+)
- Git

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

   Edite o arquivo `.env` com as configurações necessárias.

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

   Edite o arquivo `.env` com as configurações necessárias.

3. Inicie o servidor:
   ```bash
   ./start-dev-server.sh
   ```
   Ou manualmente:
   ```bash
   pnpm run server
   ```
   O buscador inteligente estará disponível em `http://localhost:3001`.

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

## Solução de Problemas Comuns

- **Erro de CORS**: Verifique se as origens permitidas estão configuradas corretamente nos arquivos de configuração.
- **Erro de conexão com API**: Verifique se os servidores backend estão em execução e se as URLs estão configuradas corretamente.
- **Erro de autenticação**: Verifique se as chaves de API estão configuradas corretamente.
