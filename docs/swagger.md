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

### Buscador Inteligente

- **POST /api/v1/ncm**: Consulta a classificação fiscal (NCM) de produtos
- **POST /api/v1/ncm/deep-research**: Inicia uma análise profunda de NCM
- **GET /api/v1/ncm/deep-research/{requestId}**: Obtém o status de uma análise profunda

## Schemas (Modelos de Dados)

A documentação Swagger também fornece detalhes sobre os modelos de dados utilizados nas APIs:

- **NCMRequest**: Estrutura de uma requisição de consulta NCM
- **NCMResponse**: Estrutura de uma resposta de consulta NCM
- **DeepResearchRequest**: Estrutura de uma requisição de análise profunda
- **DeepResearchStatus**: Estrutura de status de uma análise profunda

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
