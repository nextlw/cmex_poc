# Exemplos de Uso do @cmex/shared-types

Esta pasta contém exemplos de como usar o pacote @cmex/shared-types em projetos frontend e backend.

## Estrutura

- `frontend-usage.ts`: Exemplo de como adaptar o código do frontend para usar o pacote
- `backend-usage.ts`: Exemplo de como adaptar o código do backend para usar o pacote

## Migrando para o Pacote Compartilhado

### No Frontend

1. Instale o pacote:
   ```bash
   npm install @cmex/shared-types
   ```

2. Substitua as importações diretas dos transformadores:
   ```typescript
   // Antes
   import { transformQueryList } from "../../utils/transformers/queryTransformers";
   
   // Depois
   import { Query } from '@cmex/shared-types';
   // Use como: Query.transformQueryList()
   ```

3. Aproveite a validação de schemas:
   ```typescript
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
   ```typescript
   import { Logs } from '@cmex/shared-types';
   
   // A resposta de logs agora inclui sempre dois campos obrigatórios
   const logsResponse = Logs.transformLogsResponse(backendLogs);
   // logsResponse agora terá sempre serverLogs e logs
   console.log(logsResponse.serverLogs, logsResponse.logs);
   ```

### No Backend

1. Instale o pacote:
   ```bash
   npm install @cmex/shared-types
   ```

2. Substitua as definições de tipos locais:
   ```typescript
   // Antes
   type QueryStatus = 'processing' | 'in_progress' | 'completed' | 'error';
   
   // Depois
   import { Query } from '@cmex/shared-types';
   // Use como: Query.BackendQueryStatus
   ```

3. Valide dados antes de enviá-los para o frontend:
   ```typescript
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
   ```typescript
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