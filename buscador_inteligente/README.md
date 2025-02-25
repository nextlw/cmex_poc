# CMEX Backend (Buscador Inteligente)

Serviço de backend para a plataforma CMEX que implementa o buscador inteligente.

## Instalação

```bash
npm install
```

## Execução

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Docker

### Build Docker Image
```bash
docker build -t cmex-backend:latest .
```

### Run Docker Container
```bash
docker run -p 3000:3000 --env-file .env cmex-backend:latest
```

### Docker Compose
```bash
docker-compose up
```

## APIs Disponíveis

### API de Consultas

#### Criação de consulta
```
POST /api/v1/query
{
    "question": "O que é TypeScript?",
    "title": "Consulta sobre TypeScript"
}
```

Resposta:
```json
{
  "requestId": "1234567890"
}
```

#### Obtenção de consultas
```
GET /api/v1/queries
```

Resposta:
```json
[
  {
    "id": "1234567890",
    "title": "Consulta sobre TypeScript",
    "question": "O que é TypeScript?",
    "timestamp": "2023-02-25T12:00:00Z",
    "status": "completed"
  }
]
```

#### Streaming de resultados
```
GET /api/v1/stream/:requestId
```

### API de Logs

#### GET /api/v1/logs
Retorna os logs do servidor com opções de filtragem.

**Parâmetros de consulta:**
- `level`: Filtrar por nível de log (opcional)
- `since`: Filtrar logs a partir de uma data (opcional)
- `limit`: Limitar número de logs retornados (padrão: 100)

**Exemplo de resposta:**
```json
{
  "logs": [
    {
      "timestamp": "2023-02-25T12:00:00Z",
      "message": "Servidor iniciado",
      "level": "info"
    }
  ],
  "serverLogs": [
    {
      "timestamp": "2023-02-25T12:00:00Z",
      "message": "Servidor iniciado",
      "level": "info"
    }
  ],
  "count": 1,
  "total": 100
}
```

**Observação:** A partir da versão 1.0.1 do pacote `@cmex/shared-types`, o campo `logs` é obrigatório e contém o mesmo conteúdo que `serverLogs` para manter compatibilidade com diferentes implementações.

## Pacote @cmex/shared-types

O projeto está em processo de migração para utilizar o pacote `@cmex/shared-types` para compartilhar tipos e validações entre frontend e backend. Este pacote oferece:

1. Centralização das definições de tipos
2. Validação de dados com Zod
3. Transformadores padronizados

### Histórico de Alterações

**v1.0.1 (25/02/2025)**
- Alteração na interface `LogsResponse`: o campo `logs` agora é obrigatório em vez de opcional
- Modificada a função `transformLogsResponse` para garantir que o campo `logs` sempre seja definido
- A API `/api/v1/logs` foi atualizada para retornar sempre os campos `logs` e `serverLogs`

### Compatibilidade

Estamos mantendo compatibilidade com implementações anteriores durante a transição:
- O campo `logs` na resposta da API `/api/v1/logs` agora é obrigatório
- O conteúdo dos campos `logs` e `serverLogs` é idêntico para garantir compatibilidade

## Estrutura do Projeto

```
buscador_inteligente/
├── src/
│   ├── server.ts               # Servidor Express
│   ├── agent.ts                # Agente de busca inteligente
│   ├── types.ts                # Tipos e interfaces
│   ├── utils/                  # Utilitários
│   ├── tools/                  # Ferramentas do agente
│   └── types/                  # Tipos específicos
├── queries/                    # Armazenamento de consultas
├── public/                     # Arquivos estáticos
└── docs/                       # Documentação
```

## Documentação Adicional

Para mais informações sobre o funcionamento do buscador inteligente, consulte a documentação completa na pasta `docs/`. 