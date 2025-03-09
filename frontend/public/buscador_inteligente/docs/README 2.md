# Documentação do CMEX Backend

Este diretório contém a documentação detalhada do backend da plataforma CMEX.

## Índice

### Documentação de APIs

- [API de Logs](./API_LOGS.md) - Descrição detalhada da API de logs, incluindo alterações recentes na interface LogsResponse

### Modelos de IA

- [Modelos de IA](./MODELOS_IA.md) - Documentação detalhada sobre os modelos de IA suportados, incluindo Gemini e modelos locais

### Evolução do Projeto

- [Evolução do Projeto](./EVOLUCAO_PROJETO.md) - História da evolução do projeto desde a concepção inicial como DeepResearch até a implementação atual do CMEX Backend

### Documentação Técnica

- [Mapeamento de Tipos](./mapeamento-tipos.md) - Visão geral das estruturas de tipos utilizadas no sistema, tanto no backend quanto no frontend
- [Transformações de Tipos](./transformacoes-tipos.md) - Descrição de como os tipos são transformados entre o backend e o frontend
- [CMEX Backend](./CMEX%20Backend%20\(Buscador%20Inteligente\).md) - Documentação completa do backend CMEX

### Guias de Implementação

Para guias de implementação e migração para o pacote `@cmex/shared-types`, consulte:

- [Guia de Implementação](../../shared-types/IMPLEMENTACAO.md) no repositório do pacote compartilhado
- [Exemplos de Uso](../../shared-types/examples/README.md) para o frontend e backend

## Exemplo de Configuração

```json
{
  "models": {
    "local": "qwen2.5-7b-instruct-1m",
    "gemini": "gemini-2.0-flash"
  },
  "api": {
    "baseUrl": "https://api.example.com/v1",
    "timeout": 30000
  }
}
```

## Histórico de Alterações

### 25/02/2025

- Adicionada documentação sobre a evolução do projeto desde sua concepção inicial
- Adicionada documentação sobre a integração com modelos Gemini
- Adicionado diagrama de fluxo comparativo entre a implementação anterior e a atual com Gemini
- Adicionada documentação técnica sobre mapeamento e transformação de tipos
- Documentação atualizada para refletir a alteração na interface LogsResponse no pacote @cmex/shared-types
- O campo `logs` agora é obrigatório na resposta da API `/api/v1/logs`
- Padronização visual dos blocos de código em toda a documentação
