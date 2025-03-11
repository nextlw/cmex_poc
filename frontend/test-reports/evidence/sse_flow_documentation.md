# Documentação do Fluxo de Dados SSE entre Backend e Frontend

**Data da Documentação**: 10/03/2025, 19:22:39

## Sumário

1. [Componentes](#componentes)
   1.1 [Backend SSE Service](#backend-sse-service)
   1.2 [Frontend SSE Client](#frontend-sse-client)
2. [Fluxo de Dados](#fluxo-de-dados)
3. [Verificações de Teste](#verificações-de-teste)
4. [Conclusão](#conclusão)

## Componentes

### Backend SSE Service

**Backend SSE Service**

Gerencia conexões SSE e envia eventos em tempo real para o frontend

**Implementação**: `buscador_inteligente/src/services/sse-service.ts`

#### Eventos Suportados

| Tipo | Descrição |
|------|----------|
| `message` | Evento genérico para mensagens de chat |
| `progress` | Evento específico para atualizações de progresso da pesquisa |
| `thinking` | Evento para transmitir o processo de raciocínio do modelo |
| `search` | Evento para transmitir resultados de pesquisa |
| `response` | Evento para transmitir a resposta final |

#### Recursos

- Gerenciamento automático de conexões ativas
- Timeout de conexão após 60 segundos sem heartbeat
- Heartbeat a cada 30 segundos para manter conexões ativas
- Cleanup automático de conexões encerradas
- Identificação única de cada cliente via requestId

#### Resultados de Teste

**Status**: Passou

**Observações**: O serviço SSE do backend gerencia corretamente a conexão e o envio de eventos

**Endpoints Testados**:

| URL | Método | Tipo de Resposta |
|-----|--------|------------------|
| `/api/v1/stream/{requestId}` | GET | text/event-stream |

### Frontend SSE Client

**Frontend SSE Client**

Gerencia a conexão com o backend e processa eventos recebidos

**Implementação**: `frontend/src/utils/sseClient.ts`

#### Recursos

- Reconexão automática com backoff exponencial
- Detecção de timeout de heartbeat
- Feedback visual de status da conexão
- Processamento de eventos específicos
- Notificação de componentes através de sistema de eventos

#### Componentes Relacionados

| Componente | Propósito | Detalhes |
|------------|-----------|----------|
| ConnectionIndicator | Exibe status atual da conexão | Estados: connected, connecting, disconnected, error |
| DeepResearchProgress | Exibe o progresso atual da pesquisa | Atualiza em tempo real ao receber eventos de progresso |
| ChatMessage | Renderiza diferentes tipos de mensagens | Tipos: query, response, search, error |

#### Resultados de Teste

**Status**: Passou

**Observações**: O cliente SSE do frontend gerencia corretamente a conexão, recebimento de eventos e reconexão automática

## Fluxo de Dados

### Passo 1: Inicialização da Conexão

**Backend**: O cliente solicita ao backend uma conexão SSE fornecendo um requestId

**Frontend**: O cliente instancia o SSEClient e chama o método connect(requestId)

**Observações**: O frontend armazena o requestId após o envio da consulta inicial

### Passo 2: Estabelecimento da Conexão

**Backend**: O backend aceita a conexão e a registra no SSEService

**Frontend**: O EventSource detecta a abertura da conexão e atualiza o status para "connected"

#### Eventos

**Direção**: Backend → Frontend

**Dados**:
```json
{
  "type": "open"
}
```

**Observações**: O ConnectionIndicator atualiza sua aparência para indicar uma conexão bem-sucedida

### Passo 3: Atualização de Progresso da Pesquisa

**Backend**: O backend envia eventos de progresso conforme a pesquisa avança

**Frontend**: O SSEClient processa o evento e notifica o DeepResearchProgress

#### Eventos

**Direção**: Backend → Frontend

**Dados**:
```json
{
  "type": "progress",
  "step": 1,
  "totalSteps": 3,
  "steps": [
    {
      "id": "step1",
      "title": "Análise da consulta",
      "status": "current"
    },
    {
      "id": "step2",
      "title": "Pesquisa de fontes",
      "status": "pending"
    },
    {
      "id": "step3",
      "title": "Formulação da resposta",
      "status": "pending"
    }
  ]
}
```

**Observações**: O DeepResearchProgress é renderizado mostrando o progresso atual

### Passo 4: Envio de Resultados de Pesquisa

**Backend**: O backend envia resultados de pesquisa conforme encontra fontes relevantes

**Frontend**: O SSEClient processa o evento e adiciona uma mensagem do tipo "search" à conversa

#### Eventos

**Direção**: Backend → Frontend

**Dados**:
```json
{
  "type": "search",
  "content": "Pesquisando por bicicletas elétricas...",
  "data": {
    "searchQuery": "bicicleta elétrica NCM",
    "urls": [
      "https://example.com/1",
      "https://example.com/2"
    ]
  }
}
```

**Observações**: O ChatPage adiciona uma nova mensagem do tipo search à conversa

### Passo 5: Envio do Processo de Raciocínio

**Backend**: O backend envia o processo de raciocínio do modelo

**Frontend**: O SSEClient processa o evento e armazena o conteúdo para exibição

#### Eventos

**Direção**: Backend → Frontend

**Dados**:
```json
{
  "type": "thinking",
  "content": "Analisando as fontes encontradas sobre bicicletas elétricas..."
}
```

**Observações**: O ThinkingSection pode ser expandido para mostrar este conteúdo

### Passo 6: Envio da Resposta Final

**Backend**: O backend envia a resposta final com referências e metadados

**Frontend**: O SSEClient adiciona uma mensagem do tipo "response" à conversa

#### Eventos

**Direção**: Backend → Frontend

**Dados**:
```json
{
  "type": "response",
  "content": "Bicicletas elétricas são classificadas no NCM 8711.60.00",
  "data": {
    "think": "A classificação de bicicletas elétricas segue a posição 87.11, que inclui motocicletas e ciclos com motor auxiliar.",
    "references": [
      {
        "url": "https://example.com/1",
        "title": "Classificação de Veículos Elétricos",
        "exactQuote": "Bicicletas elétricas classificam-se no código 8711.60.00 da NCM",
        "content": "O documento indica que bicicletas com motor elétrico auxiliar são classificadas na posição 8711.60.00."
      }
    ]
  },
  "modelName": "claude-3-opus-20240229"
}
```

**Observações**: O ChatPage adiciona uma mensagem do tipo response com ModelIndicator e ReferencesSection

### Passo 7: Manutenção da Conexão

**Backend**: O backend envia heartbeats periódicos para manter a conexão ativa

**Frontend**: O SSEClient detecta os heartbeats e atualiza o timestamp da última mensagem

#### Eventos

**Direção**: Backend → Frontend

**Dados**:
```json
{
  "type": "heartbeat",
  "timestamp": 1741645359503
}
```

**Observações**: Ocorre a cada 30 segundos em segundo plano, invisível para o usuário

### Passo 8: Tratamento de Desconexão

**Backend**: O backend detecta a desconexão e remove o cliente da lista de conexões ativas

**Frontend**: O SSEClient detecta a desconexão e tenta reconectar automaticamente

#### Eventos

**Direção**: Frontend → Backend

**Dados**:
```json
{
  "type": "close"
}
```

**Observações**: O ConnectionIndicator muda para o estado "connecting" durante a reconexão

## Verificações de Teste

### Verificação de Sincronização de Progresso

**Descrição**: O componente DeepResearchProgress atualiza corretamente conforme eventos são recebidos

**Resultado**: Verificado com sucesso

**Detalhes**: O progresso visual corresponde exatamente aos eventos enviados pelo backend

### Verificação de Renderização de Mensagens

**Descrição**: O componente ChatMessage renderiza corretamente diferentes tipos de mensagens

**Resultado**: Verificado com sucesso

**Detalhes**: Todos os tipos de mensagens (query, response, search, error) são renderizados corretamente

### Verificação de Indicação de Status

**Descrição**: O componente ConnectionIndicator reflete precisamente o status da conexão

**Resultado**: Verificado com sucesso

**Detalhes**: O indicador muda corretamente entre os estados connected, connecting, disconnected e error

### Verificação de Reconexão Automática

**Descrição**: O SSEClient tenta reconectar automaticamente após perda de conexão

**Resultado**: Verificado com sucesso

**Detalhes**: A reconexão é tentada com backoff exponencial e é bem-sucedida quando o servidor está disponível

## Conclusão

O fluxo de dados entre o backend e o frontend via SSE funciona corretamente

### Pontos Fortes

- Comunicação em tempo real eficiente
- Feedback visual claro do status da conexão
- Reconexão automática resiliente
- Atualizações incrementais de progresso

### Áreas para Melhoria

- Adicionar compressão de payload para reduzir o tráfego de rede
- Implementar buffer de mensagens durante reconexão para evitar perda de dados
- Melhorar a manipulação de erros específicos
