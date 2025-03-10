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

6. **Configuração para Produção**
   - Criado arquivo `render.yaml` com configuração para todos os serviços
   - Configurado Redis como serviço compartilhado

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

Esta abordagem permite que as rotas sejam processadas de forma modular e organizada, sem os problemas de tipagem anteriores.

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

## O que ainda precisa ser feito

1. **Revisão final dos tipos**

   - Verificar se há outros problemas de tipagem no código
   - Ajustar as interfaces conforme necessário

2. **Testes**

   - Testar a comunicação entre os serviços em ambiente de desenvolvimento
   - Verificar se a seleção de modelo está funcionando corretamente

3. **Implementação completa**

   - Completar a função `processModelSelection` no arquivo Redis
   - Conectar os modelos existentes com o novo sistema

4. **Segurança**

   - Adicionar autenticação para as APIs
   - Configurar CORS adequadamente

5. **Monitoramento**

   - Implementar logs estruturados
   - Adicionar métricas para monitoramento

6. **Fallback**
   - Implementar mecanismos de fallback caso o Redis fique indisponível

## Próximos passos

1. Testar a comunicação em ambiente de desenvolvimento
2. Configurar o ambiente de produção no Render
3. Implementar monitoramento e logs
4. Testar em produção

## Observações

- O Redis é usado como message broker para comunicação assíncrona entre os serviços
- O SSE (Server-Sent Events) continua sendo usado para comunicação em tempo real com o frontend
- O polling foi substituído por um sistema de eventos baseado em Redis
- A seleção de modelo agora é respeitada e encaminhada para o Node.js
- A organização dos controladores segue o padrão existente no projeto
