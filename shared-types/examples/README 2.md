# Exemplos de Uso do @cmex/shared-types

Esta pasta contém exemplos de como usar o pacote @cmex/shared-types em projetos frontend e backend.

## Estrutura

- `frontend-usage.ts`: Exemplo de como adaptar o código do frontend para usar o pacote
- `backend-usage.ts`: Exemplo de como adaptar o código do backend para usar o pacote

## Migrando para o Pacote Compartilhado

### No Frontend

1. Instale o pacote:
   ```bash style="background-color: #161921"
   npm install @cmex/shared-types
   ```

2. Substitua as importações diretas dos transformadores:
   ```typescript style="background-color: #161921"
   // Antes
   import { transformQueryList } from "../../utils/transformers/queryTransformers";
   
   // Depois
   import { Query } from '@cmex/shared-types';
   // Use como: Query.transformQueryList()
   ```

3. Aproveite a validação de schemas:
   ```typescript style="background-color: #161921"
   import { Query } from '@cmex/shared-types';
   
   // Validar dados de entrada
   const result = Query.backendQuerySchema.safeParse(data);
   if (result.success) {
     // Dados válidos
   } else {
     // Erros de validação
     console.error(result.error.format());
   }
   ```

4. Atualizações recentes:
   ```typescript style="background-color: #161921"
   import { Logs } from '@cmex/shared-types';
   
   // A resposta de logs agora inclui sempre dois campos obrigatórios
   const logsResponse = Logs.transformLogsResponse(backendLogs);
   // logsResponse agora terá sempre serverLogs e logs
   console.log(logsResponse.serverLogs, logsResponse.logs);
   ```

### No Backend

1. Instale o pacote:
   ```bash style="background-color: #161921"
   npm install @cmex/shared-types
   ```

2. Substitua as definições de tipos locais:
   ```typescript style="background-color: #161921"
   // Antes
   type QueryStatus = 'processing' | 'in_progress' | 'completed' | 'error';
   
   // Depois
   import { Query } from '@cmex/shared-types';
   // Use como: Query.BackendQueryStatus
   ```

3. Valide dados antes de enviá-los para o frontend:
   ```typescript style="background-color: #161921"
   import { Stream } from '@cmex/shared-types';
   
   // Validar antes de enviar
   const message = {
     type: 'answer',
     data: 'Resposta processada'
   };
   
   try {
     Stream.backendStreamMessageTypeSchema.parse(message.type);
     // Mensagem válida, pode enviar
   } catch (error) {
     // Tipo de mensagem inválido
     console.error('Tipo de mensagem inválido:', error);
   }
   ```

4. Prepare respostas de logs conforme o padrão atualizado:
   ```typescript style="background-color: #161921"
   import { Logs } from '@cmex/shared-types';
   
   // Ao criar uma resposta de logs, inclua sempre os dois campos obrigatórios
   const serverLogs = [...]; // array de logs do servidor
   
   // Este transformador garante que tanto serverLogs quanto logs estarão preenchidos
   const logsResponse = Logs.transformLogsResponse(serverLogs);
   
   // Se necessário adicionar promptContents
   logsResponse.promptContents = [
     { filename: 'arquivo.txt', content: 'conteúdo do prompt' }
   ];
   
   return logsResponse;
   ```

## Benefícios Práticos

- **Tipos consistentes**: Garantia de que frontend e backend estão usando definições compatíveis
- **Validação robusta**: Validação baseada em schemas com mensagens de erro detalhadas
- **Documentação**: Os tipos servem como documentação do contrato de API
- **Centralização**: Atualizações de tipos afetam automaticamente ambos os projetos
- **Segurança de tipo**: Detecção de erros em tempo de compilação

## Histórico de Alterações

- **25/02/2025**: Atualização da interface `LogsResponse` - campo `logs` agora é obrigatório

## Compatibilidade com Modelos Gemini

### No Frontend

Para trabalhar com as respostas dos modelos Gemini:

```typescript style="background-color: #161921"
import { ModelResponse } from '@cmex/shared-types';

// Hook para detectar o tipo de modelo
const { isGeminiModel } = useModelDetection(modelId);

// Componente que adapta a visualização com base no tipo de modelo
function ResponseDisplay({ response, modelId }) {
  const { isGeminiModel } = useModelDetection(modelId);
  
  // Para respostas em formato markdown do Gemini
  if (isGeminiModel && typeof response === 'string') {
    // Extrair JSON se estiver em formato markdown
    const jsonData = ModelResponse.extractJsonFromGeminiResponse(response);
    return <StructuredResponseView data={jsonData} />;
  }
  
  // Para respostas estruturadas de modelos locais
  return <StructuredResponseView data={response} />;
}
```

### No Backend

Para processar prompts e respostas com modelos Gemini:

```typescript style="background-color: #161921"
import { ModelResponse } from '@cmex/shared-types';

// Detecção do tipo de modelo
const isGeminiModel = modelConfig.model.startsWith('gemini-');

// Configuração adaptativa para API de modelo
if (isGeminiModel) {
  console.log('Usando configuração para Gemini');
  // Formatação especial para prompt do Gemini
  const formattedPrompt = ModelResponse.formatGeminiPrompt(prompt);
  
  // Processamento da resposta específico para Gemini
  const rawResponse = await geminiClient.generateContent(formattedPrompt);
  const extractedJson = ModelResponse.extractJsonFromGeminiResponse(rawResponse);
  
  return extractedJson;
} else {
  console.log('Usando configuração para modelo local');
  // Processamento para modelos locais
  // ...
}
```

## Histórico de Alterações

- **25/02/2025**: 
  - Atualização da interface `LogsResponse` - campo `logs` agora é obrigatório
  - Adicionado suporte para modelos Gemini com módulo `ModelResponse`
  - Padronização visual dos blocos de código em toda a documentação 