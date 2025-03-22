# Implementação da Comunicação via Redis

## O que foi implementado

1. **Serviço Redis para Node.js**

   - Criado arquivo `buscador_inteligente/src/services/redis-service.ts`
   - Implementado sistema de publicação/assinatura
   - Integrado com o EventEmitter existente

2. **Serviço Redis para FastAPI**

   - Criado arquivo `fastapi/app/services/redis_service.py`
   - Implementado sistema de cache local para armazenar atualizações
   - Configurado listener em thread separada

3. **Integração no servidor Node.js**

   - Modificado `server.ts` para inicializar o serviço Redis
   - Adicionadas rotas para processar consultas com modelo específico
   - Adicionada rota para chat direto

4. **Integração no FastAPI**

   - Modificado `main.py` para inicializar o serviço Redis
   - Adicionadas rotas para processar consultas e verificar status

5. **Frontend**

   - Criado serviço de API para comunicação com backend
   - Implementado componente de pesquisa
   - Implementado componente de chat
   - Adicionada implementação de Server-Sent Events (SSE) para atualização em tempo real

6. **Configuração para Produção**
   - Criado arquivo `render.yaml` com configuração para todos os serviços
   - Configurado Redis como serviço compartilhado

## Estado Atual da Implementação

1. **Server-Sent Events (SSE)**

   - Implementada rota `/api/v1/sse/connect/:requestId` no servidor Node.js para permitir conexões SSE
   - Criado serviço SSE (`sse-service.ts`) para gerenciar conexões e enviar eventos
   - Implementado cliente SSE no frontend para substituir o polling

2. **Comunicação Redis**

   - Implementada comunicação completa entre serviços através do Redis
   - Corrigida assinatura Redis para usar Promises em vez de callbacks
   - Adicionado canal `NCM_REQUEST` para comunicação específica de requisições NCM

3. **DeepResearchSidebar**
   - Substituído o mecanismo de polling por conexão SSE para atualizações em tempo real
   - Implementada lógica para gerenciar reconexões e tratamento de erros

## Erros encontrados e correções

### Erro 1: Assinatura do Redis subscribe

Na implementação original do serviço Redis em `buscador_inteligente/src/services/redis-service.ts`, a assinatura aos canais Redis estava incorreta. O erro indicava que o callback estava em um formato incompatível.

**Solução:**

```typescript
// Em vez de:
subscriber.subscribe(
  CHANNELS.FASTAPI_TASK_UPDATES,
  CHANNELS.MODEL_SELECTION,
  (err: Error | null) => { ... }
);

// Use:
subscriber.subscribe(CHANNELS.FASTAPI_TASK_UPDATES, CHANNELS.MODEL_SELECTION)
  .then(() => {
    console.log("Assinado nos canais Redis com sucesso");
  })
  .catch((err) => {
    console.error("Erro ao assinar canais Redis:", err);
  });
```

### Erro 2: Rotas Express em server.ts

Havia erros persistentes nas rotas definidas em `server.ts` para `/api/v1/process-with-model` e `/api/v1/chat`, indicando incompatibilidade de tipagem.

**Solução implementada:**
Após analisar o código do projeto, especialmente como o `ncmRouter` foi implementado, decidimos seguir um padrão semelhante:

1. Criamos um novo arquivo controlador: `buscador_inteligente/src/controllers/modelController.ts`
2. Implementamos handlers separados para cada rota
3. Criamos uma função `modelRouter` que gerencia as rotas baseada no path da requisição
4. Integramos o controlador no `server.ts` utilizando middleware

Exemplo de código:

```typescript
// Em modelController.ts
export async function modelRouter(
  req: ModelRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const path = req.path;

  try {
    if (path === "/process-with-model" && req.method === "POST") {
      await processWithModelHandler(req, res);
    } else if (path === "/chat" && req.method === "POST") {
      await chatHandler(req, res);
    } else {
      next(); // Passa para o próximo middleware
    }
  } catch (error) {
    console.error("Erro no modelRouter:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Em server.ts
app.use("/api/v1", async (req, res, next) => {
  await modelRouter(req, res, next);
});
```

### Erro 3: Parâmetros e Tipagem em ActionTracker

No código, há um erro indicando que `ActionTracker` espera receber um parâmetro `{ requestId: string }`.

**Solução:**

```typescript
// Em vez de:
const actionTracker = new ActionTracker();

// Use:
const actionTracker = new ActionTracker({ requestId });
```

### Erro 4: Assinatura de getResponse

A função `getResponse` tem uma assinatura diferente da que estava sendo usada.

**Solução:**

```typescript
// A assinatura correta é:
getResponse(
  question: string,
  tokenBudget: number = 10_000_000,
  maxBadAttempts: number = 10,
  existingContext?: Partial<TrackerContext>,
  requestId?: string
)

// Use assim:
const responseResult = await getResponse(
  query,          // question
  10_000_000,     // tokenBudget
  10,             // maxBadAttempts
  {               // existingContext
    tokenTracker,
    actionTracker
  },
  requestId       // requestId
);
```

### Erro 5: Acesso a propriedades no resultado

Os resultados da função `getResponse` não têm acesso direto a propriedades como `title` e `answer`.

**Solução:**

```typescript
// Para AnswerAction:
if (responseResult.result && responseResult.result.action === "answer") {
  const answerAction = responseResult.result as AnswerAction;
  summary = answerAction.answer;
}
```

### Erro 6: Problemas com CORS no FastAPI

Ocorreram problemas com CORS ao tentar acessar endpoints de APIs em diferentes origens.

**Solução:**
Ajustada a configuração CORS no FastAPI para permitir requests de diferentes origens:

```python
# Em main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar origens específicas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Erro 7: Problemas com rotas de API

Inconsistências entre os caminhos de API no frontend e backend.

**Solução:**
Ajustado o arquivo axiosConfig.ts para usar os prefixos corretos:

```typescript
// De:
baseURL: "/api/v1";

// Para:
baseURL: "/api";
```

## O que ainda precisa ser feito

1. **Testes adicionais**

   - Testar sob diferentes condições de carga
   - Verificar tratamento de desconexões Redis

2. **Otimizações**

   - Implementar limite de conexões SSE por usuário
   - Melhorar gestão de memória no cache Redis

3. **Monitoramento**

   - Adicionar métricas de uso do Redis
   - Monitorar desempenho das conexões SSE

4. **Segurança**
   - Implementar autenticação nas conexões SSE
   - Criptografar mensagens Redis sensíveis

## Conclusão

A implementação de comunicação via Redis e SSE substituiu com sucesso o mecanismo de polling anterior, resultando em menor uso de recursos e comunicação mais eficiente entre os serviços. O sistema agora é mais escalável e robusto, permitindo a comunicação assíncrona entre o FastAPI e o Node.js, com atualizações em tempo real para o frontend.
