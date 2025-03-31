# Sistema de Schemas Zod para o Agente CMEX

Este diretório contém a implementação de um sistema de schemas baseado em Zod para o agente CMEX, que oferece validação em tempo de execução, tipagem mais segura e melhor conversão entre diferentes formatos de schema.

## Benefícios

1. **Validação em Tempo de Execução**: Verifica se os objetos correspondem aos tipos esperados durante a execução.
2. **Melhor Tipagem**: Oferece inferência de tipos TypeScript mais precisa.
3. **Mensagens de Erro Detalhadas**: Fornece mensagens de erro claras quando a validação falha.
4. **Conversão entre Formatos**: Converte automaticamente entre schemas Zod e schemas do Google Generative AI.
5. **Tratamento Robusto de Respostas**: Melhor manipulação de diferentes formatos de resposta dos modelos.
6. **Documentação via JSDoc**: Todas as funções e classes têm documentação detalhada.

## Arquivos Principais

- `zod-schemas.ts`: Define os schemas Zod para diferentes partes do agente.
- `safe-object-generator.ts`: Implementa a geração segura de objetos a partir de respostas dos modelos.
- `agent-schema-adapter.ts`: Fornece uma interface simples para usar schemas Zod com o agente.

## Como Utilizar

### 1. Inicialização

```typescript
import { createSchemaAdapter } from "./utils/agent-schema-adapter";

// Na função getResponse do seu agente
function getResponse(question: string, ...) {
  // ...
  const context = {
    tokenTracker: new TokenTracker(tokenBudget),
    actionTracker: new ActionTracker(),
    outputs: []
  };

  // Inicialize o adaptador de schema
  const schemaAdapter = createSchemaAdapter(context, activeModelClient);

  // Defina o estilo de linguagem
  schemaAdapter.setLanguage("formal Portuguese", "pt-BR");
  // ...
}
```

### 2. Obtenção de Schemas

```typescript
// Substitua chamadas para getSchema por:
const schema = schemaAdapter.getAgentGoogleSchema(
  allowReflect,
  allowRead,
  allowAnswer,
  allowSearch
);

// Se precisar do schema Zod para validação:
const zodSchema = schemaAdapter.getAgentZodSchema(
  allowReflect,
  allowRead,
  allowAnswer,
  allowSearch
);
```

### 3. Validação de Respostas

```typescript
try {
  // Analisa a resposta bruta do modelo
  const rawResponse = JSON.parse(responseText);

  // Valida contra o schema Zod
  const validatedResponse = zodSchema.parse(rawResponse);

  // Agora validatedResponse é tipado corretamente
  if (validatedResponse.action === "search") {
    // TypeScript sabe que searchQuery existe aqui
    console.log(validatedResponse.searchQuery);
  }
} catch (error) {
  console.error("Erro de validação:", error);
  // Trate o erro adequadamente
}
```

### 4. Geração de Objetos

```typescript
// Gere objetos validados diretamente
const result = await schemaAdapter.generateObject({
  model: modelName,
  schema: zodSchema,
  system: prompt,
  prompt: question,
});

// result.object já está validado e tipado
console.log(result.object.action);
```

## Exemplos de Uso

Veja o arquivo `examples/zod-example.ts` para exemplos completos de como usar o sistema de schemas Zod no agente CMEX.

## Dicas para Solução de Problemas de Tipagem

1. **Problemas de Compatibilidade de Tipos**: Use `z.parse()` para garantir que os objetos correspondam aos tipos esperados.

2. **União de Tipos Complexos**: Utilize o padrão de discriminação baseado no tipo de ação.

3. **Debug de Schemas**: Use `zodSchemas.convertToJsonSchema(schema)` para ver a representação JSON do schema para debugging.

4. **Tipagem Personalizada**: Estenda os schemas existentes com suas próprias regras de validação:

```typescript
const customSchema = z.object({
  customField: z.string().min(3).max(10)
}).merge(zodSchemas.getAgentSchema(...));
```

5. **Transformações**: Use `.transform()` para modificar os valores durante a validação:

```typescript
const schema = z.object({
  date: z.string().transform((str) => new Date(str)),
});
```

## Integração com Sistemas Existentes

O sistema foi projetado para funcionar com a biblioteca Google Generative AI e pode ser facilmente adaptado para outras bibliotecas de modelos de linguagem.

---

Por favor, consulte o código fonte para mais detalhes e exemplos de implementação.
