# Documentação Swagger

Este guia explica como acessar e utilizar a documentação interativa Swagger para as APIs do projeto CMEX.

## O que é Swagger?

Swagger (OpenAPI) é uma linguagem de descrição de interface para descrever APIs RESTful. Ele permite que tanto humanos quanto computadores descubram e compreendam os recursos de um serviço sem acesso ao código-fonte ou documentação adicional.

## Acessando a Documentação Swagger

### API FastAPI

A documentação Swagger da API FastAPI está disponível em:

```
http://localhost:10000/api/docs
```

Alternativamente, você pode acessar a documentação ReDoc em:

```
http://localhost:10000/api/redoc
```

### API Buscador Inteligente

A documentação Swagger da API do Buscador Inteligente está disponível em:

```
http://localhost:3001/api/docs
```

## Como Usar a Documentação Swagger

1. **Navegação**: Explore os endpoints disponíveis, organizados por tags ou categorias.
2. **Autenticação**: Se necessário, autentique-se usando o botão "Authorize" no topo da página.
3. **Teste de Endpoints**: Clique em um endpoint para expandir seus detalhes.
4. **Execução de Requisições**: Preencha os parâmetros necessários e clique em "Execute" para testar o endpoint diretamente na interface.
5. **Visualização de Respostas**: Veja exemplos de respostas e códigos de status HTTP.

## Endpoints Principais

### FastAPI

- **GET /api/queries**: Lista todas as consultas realizadas
- **POST /api/queries**: Cria uma nova consulta
- **GET /api/queries/{id}**: Obtém detalhes de uma consulta específica
- **POST /api/redis/publish**: Publica uma mensagem no canal Redis especificado
- **GET /api/redis/status**: Verifica o status da conexão Redis

### Buscador Inteligente

- **POST /api/v1/ncm**: Consulta a classificação fiscal (NCM) de produtos
- **POST /api/v1/ncm/deep-research**: Inicia uma análise profunda de NCM
- **GET /api/v1/ncm/deep-research/{requestId}**: Obtém o status de uma análise profunda
- **GET /api/v1/sse/connect/{requestId}**: Estabelece uma conexão SSE para receber atualizações em tempo real
- **GET /api/v1/stream/{requestId}**: Alternativa à conexão SSE para streaming de eventos
- **GET /api/v1/redis/status**: Verifica o status da conexão Redis

## Schemas (Modelos de Dados)

A documentação Swagger também fornece detalhes sobre os modelos de dados utilizados nas APIs:

- **NCMRequest**: Estrutura de uma requisição de consulta NCM
- **NCMResponse**: Estrutura de uma resposta de consulta NCM
- **DeepResearchRequest**: Estrutura de uma requisição de análise profunda
- **DeepResearchStatus**: Estrutura de status de uma análise profunda
- **StreamMessage**: Estrutura das mensagens enviadas via SSE
- **RedisMessage**: Estrutura das mensagens publicadas no Redis

## Comunicação em Tempo Real

### Server-Sent Events (SSE)

Para estabelecer uma conexão SSE e receber atualizações em tempo real:

1. Acesse `/api/v1/sse/connect/{requestId}` no navegador ou use a API EventSource.
2. As mensagens serão enviadas em formato JSON com um tipo específico.
3. Os tipos de eventos incluem: `message`, `progress`, `answer`, `thinking`, `error`.

### Redis Pub/Sub

O sistema utiliza Redis para comunicação entre os microserviços:

1. O FastAPI publica mensagens nos canais Redis.
2. O Buscador Inteligente se inscreve nos canais e processa as mensagens.
3. Os resultados são enviados ao cliente via SSE.

## Exportação da Documentação

Você pode exportar a documentação Swagger em formato JSON ou YAML para uso em outras ferramentas:

- FastAPI: `http://localhost:10000/api/openapi.json`
- Buscador Inteligente: `http://localhost:3001/api/openapi.json`

## Configuração do Swagger

### FastAPI

A configuração do Swagger no FastAPI é feita no arquivo `fastapi/app/main.py`:

```python
app = FastAPI(
    title=SETTINGS.PROJECT_NAME,
    openapi_url=f"{SETTINGS.API_V1_STR}/openapi.json",
    docs_url=f"{SETTINGS.API_V1_STR}/docs",
    redoc_url=f"{SETTINGS.API_V1_STR}/redoc",
)
```

### Buscador Inteligente

A configuração do Swagger no Buscador Inteligente é feita no arquivo `buscador_inteligente/src/server.ts`:

```typescript
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Busca Inteligente NCM",
      version: "1.0.0",
      description: "API para consulta de NCM utilizando IA",
    },
    servers: [
      {
        url: `http://localhost:${port}/api/v1`,
        description: "Servidor de desenvolvimento",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

## Testando Endpoints SSE

Por padrão, o Swagger não suporta teste de endpoints SSE diretamente na interface. Para testar esses endpoints:

1. Use um navegador e acesse diretamente o URL: `http://localhost:3001/api/v1/sse/connect/{requestId}`
2. Verifique o console do navegador para ver as mensagens recebidas
3. Ou use uma ferramenta como Postman que suporta conexões SSE

## Diagrama de Comunicação

A comunicação entre os serviços ocorre da seguinte forma:

1. **Cliente** ↔ **Frontend** (React)
2. **Frontend** → **Buscador Inteligente** (Via API REST)
3. **Buscador Inteligente** ↔ **FastAPI** (Via Redis Pub/Sub)
4. **Buscador Inteligente** → **Cliente** (Via SSE)

Esta arquitetura permite comunicação assíncrona e atualizações em tempo real.
