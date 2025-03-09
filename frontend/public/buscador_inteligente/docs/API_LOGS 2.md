# Documentação da API de Logs

## Visão Geral
A API de Logs fornece acesso aos logs do servidor, permitindo filtragem e paginação. Esta documentação detalha o formato da resposta e as alterações recentes para compatibilidade com o pacote `@cmex/shared-types`.

## Endpoint

```
GET /api/v1/logs
```

## Parâmetros de Consulta

| Parâmetro | Tipo   | Descrição                                  | Obrigatório |
|-----------|--------|--------------------------------------------|-----------  |
| level     | string | Filtrar por nível de log (debug, info, warn, error) | Não |
| since     | string | Filtrar logs a partir de uma data (ISO 8601) | Não |
| limit     | number | Limitar número de logs retornados (padrão: 100) | Não |

## Formato da Resposta

```json style="background-color: #161921"
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

## Campos da Resposta

| Campo       | Tipo   | Descrição                                      |
|-------------|--------|-------------------------------------------------|
| logs        | array  | **Obrigatório.** Array principal de logs do servidor |
| serverLogs  | array  | **Obrigatório.** Mesmo conteúdo que logs (para compatibilidade) |
| count       | number | Número de logs retornados após filtragem |
| total       | number | Número total de logs no servidor |

## Alterações Recentes

### Versão 1.0.1 (25/02/2025)
- O campo `logs` agora é **obrigatório** na resposta
- O campo `logs` contém o mesmo conteúdo que `serverLogs` para manter compatibilidade com implementações existentes
- Esta alteração foi feita para alinhar com a atualização do pacote `@cmex/shared-types`, onde a interface `LogsResponse` agora exige o campo `logs` como obrigatório

## Exemplo de Uso

### Requisição

```bash
curl -X GET "http://localhost:3000/api/v1/logs?level=info&limit=10"
```

### Resposta

```json style="background-color: #161921"
{
  "logs": [
    {
      "timestamp": "2023-02-25T12:00:00Z",
      "message": "Servidor iniciado",
      "level": "info"
    },
    {
      "timestamp": "2023-02-25T12:01:00Z",
      "message": "Consulta recebida",
      "level": "info"
    }
  ],
  "serverLogs": [
    {
      "timestamp": "2023-02-25T12:00:00Z",
      "message": "Servidor iniciado",
      "level": "info"
    },
    {
      "timestamp": "2023-02-25T12:01:00Z",
      "message": "Consulta recebida",
      "level": "info"
    }
  ],
  "count": 2,
  "total": 100
}
```

## Manipulação de Erros

A API retorna códigos HTTP padrão:

- 200: Sucesso
- 400: Parâmetros inválidos
- 500: Erro do servidor

## Implementação com @cmex/shared-types

Para consumir esta API usando o pacote compartilhado:

```typescript style="background-color: #161921"
import { Logs } from '@cmex/shared-types';

// Obter logs do backend
const response = await fetch('/api/v1/logs');
const data = await response.json();

// Transformar a resposta para garantir compatibilidade
const logsResponse = Logs.transformLogsResponse(data.logs);

// Você pode acessar tanto logs quanto serverLogs
console.log(logsResponse.logs, logsResponse.serverLogs);
```
