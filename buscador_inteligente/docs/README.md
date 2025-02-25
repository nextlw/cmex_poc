# Documentação do CMEX Backend

Este diretório contém a documentação detalhada do backend da plataforma CMEX.

## Índice

### Documentação de APIs

- [API de Logs](./API_LOGS.md) - Descrição detalhada da API de logs, incluindo alterações recentes na interface LogsResponse

### Guias de Implementação

Para guias de implementação e migração para o pacote `@cmex/shared-types`, consulte:

- [Guia de Implementação](../../shared-types/IMPLEMENTACAO.md) no repositório do pacote compartilhado
- [Exemplos de Uso](../../shared-types/examples/README.md) para o frontend e backend

## Histórico de Alterações

### 25/02/2025
- Documentação atualizada para refletir a alteração na interface LogsResponse no pacote @cmex/shared-types
- O campo `logs` agora é obrigatório na resposta da API `/api/v1/logs` 