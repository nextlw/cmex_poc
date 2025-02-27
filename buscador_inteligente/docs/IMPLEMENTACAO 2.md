# Guia de Implementação - @cmex/shared-types

Este documento fornece orientações sobre como implementar e migrar para o pacote `@cmex/shared-types`.

## 1. Visão Geral

O pacote `@cmex/shared-types` foi criado para:

- Centralizar as definições de tipos compartilhados entre frontend e backend
- Padronizar a validação de dados com Zod
- Implementar transformadores para converter entre formatos de backend e frontend
- Documentar incompatibilidades conhecidas e estratégias de mitigação

## 2. Estrutura do Pacote

```style="background-color: #161921"
shared-types/
├── src/
│   ├── index.ts              # Exportação principal
│   ├── query/                # Módulo de consultas
│   │   ├── index.ts
│   │   ├── types.ts          # Definições de tipos
│   │   ├── schemas.ts        # Schemas Zod
│   │   └── transformers.ts   # Funções de transformação
│   ├── stream/               # Módulo de mensagens de stream
│   │   ├── ...
│   ├── logs/                 # Módulo de logs
│   │   ├── ...
│   ├── model-response/       # Módulo para respostas de modelos de IA
│   │   ├── index.ts
│   │   ├── types.ts          # Tipos para diferentes modelos de IA
│   │   ├── gemini.ts         # Funções específicas para Gemini
│   │   └── transformers.ts   # Transformações de resposta
│   └── token-tracker/        # Módulo de rastreamento de tokens
│       ├── ...
├── tests/                    # Testes unitários
│   ├── query.test.ts
│   ├── ...
├── examples/                 # Exemplos de uso
│   ├── frontend-usage.ts
│   ├── backend-usage.ts
│   └── README.md
├── README.md
├── package.json
└── tsconfig.json
```

## 3. Plano de Migração

### 3.1. Preparação

1. **Configuração inicial do pacote:**
   ```bash style="background-color: #161921"
   cd shared-types
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Instalação nos projetos:**
   ```bash style="background-color: #161921"
   # No projeto frontend
   cd ../frontend
   npm link @cmex/shared-types
   
   # No projeto backend
   cd ../buscador_inteligente
   npm link @cmex/shared-types
   ```

### 3.2. Migração Progressiva

A migração deve ser feita de forma gradual, começando pelos módulos mais estáveis e menos críticos:

#### Fase 1: Logs e Monitoramento
- Atualizar as funções de logging para usar os tipos e transformadores do pacote compartilhado
- Implementar validação de logs com os schemas Zod fornecidos
- **Atualização recente**: Certifique-se de que todas as implementações utilizem a propriedade `logs` como obrigatória na interface `LogsResponse`

#### Fase 2: Consultas
- Migrar os tipos de consulta para usar as definições do pacote compartilhado
- Implementar transformadores para as APIs de consulta

#### Fase 3: Streaming
- Atualizar os componentes de streaming para usar os tipos e transformadores compartilhados
- Validar as mensagens de streaming usando os schemas Zod

#### Fase 4: Rastreamento de Tokens
- Implementar o módulo de rastreamento de tokens em ambos os projetos

### 3.3. Validação e Testes

Para cada fase:
1. Implementar testes de integração
2. Validar as transformações em ambientes de desenvolvimento
3. Registrar e resolver incompatibilidades encontradas

## 4. Diretrizes de Uso

### 4.1. Importação e Uso

```typescript style="background-color: #161921"
// Importação de tipos e schemas
import { Query, Stream, Logs } from '@cmex/shared-types';

// Uso de transformadores
const frontendLogs = Logs.transformLogsResponse(backendLogs);

// Validação com Zod
const queryResult = Query.backendQuerySchema.safeParse(data);
if (queryResult.success) {
  // Dados válidos
  const validData = queryResult.data;
} else {
  // Tratar erros
  const errors = queryResult.error.format();
}
```

### 4.2. Adicionando Novos Tipos

Ao adicionar novos tipos ao pacote:

1. Definir os tipos no arquivo `types.ts` do módulo apropriado
2. Criar schemas Zod correspondentes em `schemas.ts`
3. Implementar transformadores necessários em `transformers.ts`
4. Adicionar testes para os novos tipos e transformadores
5. Documentar no README do módulo

### 4.3. Lidando com Incompatibilidades

Quando encontrar incompatibilidades:

1. Documentar no arquivo `README.md` do módulo correspondente
2. Implementar transformadores para lidar com as diferenças
3. Adicionar testes específicos para os casos de incompatibilidade
4. Considerar estratégias de longo prazo para padronização

## 5. Manutenção e Versionamento

O pacote segue [Versionamento Semântico](https://semver.org/):

- **Patch (1.0.x)**: Correções de bugs e pequenas melhorias
- **Minor (1.x.0)**: Adições compatíveis com versões anteriores
- **Major (x.0.0)**: Mudanças incompatíveis com versões anteriores

Para publicar novas versões:

```bash style="background-color: #161921"
# Incrementar versão
npm version [patch|minor|major]

# Publicar
npm publish
```

### 5.1 Histórico de Alterações 

#### v1.0.1 (25/02/2025)
- Alteração na interface `LogsResponse`: o campo `logs` agora é obrigatório em vez de opcional
- Modificada a função `transformLogsResponse` para garantir que o campo `logs` sempre seja definido
- Adicionado suporte para modelos Gemini com funções específicas para processamento de respostas
- Implementado módulo `model-response` para lidar com diferentes formatos de resposta dos modelos de IA

## 6. Compatibilidade com Modelos Gemini

O pacote inclui suporte específico para lidar com os modelos Gemini da Google:

### 6.1. Processamento de Respostas

```typescript style="background-color: #161921"
import { ModelResponse } from '@cmex/shared-types';

// Extrair JSON de uma resposta em formato markdown
const rawResponse = `
\`\`\`json
{
  "answer": "Esta é a resposta",
  "references": ["fonte1", "fonte2"]
}
\`\`\`
`;

// Detectar tipo de modelo
const isGeminiModel = modelId.startsWith('gemini-');

// Processar resposta com base no tipo de modelo
if (isGeminiModel) {
  const jsonData = ModelResponse.extractJsonFromGeminiResponse(rawResponse);
  // Processar jsonData...
} else {
  // Processamento padrão para modelos locais...
}
```

### 6.2. Adaptações para Frontend e Backend

```typescript style="background-color: #161921"
// No backend (envio de prompts para o modelo)
import { ModelResponse } from '@cmex/shared-types';

function sendPromptToModel(modelId: string, prompt: string) {
  if (modelId.startsWith('gemini-')) {
    // Formatação especial para Gemini, instrução para responder em JSON
    return sendToGeminiAPI(ModelResponse.formatGeminiPrompt(prompt));
  } else {
    // Formatação para modelos locais
    return sendToLocalModel(prompt);
  }
}

// No frontend (exibição de respostas)
function displayModelResponse(modelId: string, response: any) {
  if (modelId.startsWith('gemini-') && typeof response === 'string') {
    // Para Gemini, pode ser necessário extrair JSON de markdown
    const processedResponse = ModelResponse.extractJsonFromGeminiResponse(response);
    renderStructuredResponse(processedResponse);
  } else {
    // Para modelos locais, a resposta já está estruturada
    renderStructuredResponse(response);
  }
}
```

## 7. Resolução de Problemas

### Troubleshooting Comum

1. **Problemas de tipos incompatíveis**:
   - Verificar se está usando a versão mais recente do pacote
   - Implementar transformadores para converter entre os formatos

2. **Erros de validação**:
   - Revisar a documentação dos schemas para entender as restrições
   - Usar `schema.safeParse()` para obter detalhes específicos dos erros

3. **Imports não encontrados**:
   - Verificar se o pacote está corretamente instalado e compilado
   - Confirmar que os caminhos de importação estão corretos

## 8. Próximos Passos

- Implementar validação em tempo de execução nas APIs
- Criar documentação automática dos schemas e tipos
- Explorar integração com ferramentas de validação de API

## 9. Contato

Para dúvidas ou sugestões sobre o pacote, entre em contato com a equipe responsável. 