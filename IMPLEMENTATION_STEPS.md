# Plano de Implementação em Etapas

## Status de Implementação - Março 2024

**Progresso Geral:** ~80% completo

### Status por Etapa:

- ✅ **Etapa 1 (Infraestrutura Base):** 100% completa
- ✅ **Etapa 2 (Implementação SSE):** 100% completa
- ✅ **Etapa 3 (Integração FastAPI-Node.js):** 100% completa
- 🔄 **Etapa 4 (Frontend UI/UX):** 85% completa
  - ✅ ChatPage e componentes reutilizáveis (100%)
  - 🔄 HomePage melhorias (60%)
- 🔄 **Etapa 5 (Otimização e Testes):** 40% completa

### Em andamento:

1. Melhorias na interface da HomePage
2. Implementação de cache em múltiplas camadas
3. Otimização de bundle e queries

### Próximos passos:

1. Finalizar melhorias na HomePage
2. Implementar otimizações de performance
3. Concluir documentação e testes

---

## Etapa 1: Preparação da Infraestrutura Base

**Objetivo**: Configurar a base necessária para suportar múltiplos modelos e SSE.

### 1.1 Backend Node.js - Model Service Base

```typescript
// Implementado em buscador_inteligente/src/services/model-service.ts
```

- [x] Criar interfaces base para modelos
- [x] Implementar abstração básica de modelos
- [x] Configurar sistema de eventos
- [x] Adicionar logging básico

**Review Point 1.1**:

- Verificar tipagem TypeScript
- Confirmar padrões de código
- Validar estrutura de eventos

**TODO**: Resolver problema de importação entre o pacote shared-types e o buscador_inteligente. Atualmente, estamos usando uma abordagem com tipos duplicados no model-service.ts para evitar problemas de configuração.

### 1.2 Frontend - Tipos e Interfaces

```typescript
// Implementado em shared-types/src/model/
```

- [x] Criar interfaces para estados
- [x] Definir tipos para mensagens
- [x] Estabelecer tipos para eventos SSE
- [x] Atualizar tipos existentes

**Review Point 1.2**:

- Verificar compatibilidade com interfaces existentes
- Validar nomenclatura
- Confirmar documentação

## Etapa 2: Implementação do SSE

**Objetivo**: Substituir polling por SSE para comunicação em tempo real.

### 2.1 Backend Node.js - SSE Service

```typescript
// Implementado em src/services/sse-service.ts
```

- [x] Configurar servidor SSE
- [x] Implementar sistema de heartbeat
- [x] Adicionar gerenciamento de conexões
- [x] Configurar reconexão automática

**Review Point 2.1**:

- [x] Implementado como singleton para garantir única instância
- [x] Sistema de heartbeat a cada 30 segundos
- [x] Timeout de conexão após 60 segundos sem ping
- [x] Gerenciamento automático de conexões e limpeza
- [x] Suporte a diferentes tipos de mensagens (search, answer, reflect, visit)
- [x] Integração com sistema de logs
- [x] Testar estabilidade das conexões
- [x] Verificar memory leaks
- [x] Validar reconexão

**Próximos Passos**:

1. ~~Implementar testes para o SSEService~~ ✅
2. ~~Integrar com o sistema Redis existente~~
3. ~~Atualizar o servidor para usar o novo serviço SSE~~
4. ~~Implementar testes de integração~~ ✅

**Atualizações**:

- Servidor atualizado para usar SSEService
- Removida lógica duplicada de SSE do servidor
- Melhorada gestão de conexões e eventos
- Adicionado suporte a logs em tempo real
- Integração com sistema de eventos existente
- Implementados testes de estabilidade e desempenho para o SSE backend

### 2.2 Frontend - SSE Client

```typescript
// Implementado em frontend/src/utils/sseClient.ts e integrado em frontend/src/pages/ChatPage/index.tsx
```

- [x] Implementar cliente SSE
- [x] Atualizar lógica de atualização
- [x] Adicionar tratamento de reconexão
- [x] Implementar feedback visual

**Review Point 2.2**:

- [x] Implementado como classe reutilizável
- [x] Suporte a reconexão automática com backoff exponencial
- [x] Sistema de detecção de timeout de heartbeat
- [x] Interface de feedback visual durante reconexões
- [x] Tratamento adequado de erros
- [x] Suporte a múltiplos tipos de eventos
- [x] Testar comportamento em desconexões prolongadas
- [x] Verificar comportamento em redes instáveis
- [x] Validar integração com outros componentes

**Próximos Passos**:

1. ~~Implementar testes para o SSEClient~~ ✅
2. ~~Integrar com outros componentes do frontend~~
3. ~~Melhorar o visual do indicador de status~~

**Atualizações**:

- Implementados testes de renderização e desempenho para o frontend SSE
- Validada a integração com outros componentes
- Melhorado o tratamento de erros e reconexão

## Etapa 3: Integração FastAPI-Node.js

**Objetivo**: Otimizar comunicação entre serviços para NCM.

### 3.1 FastAPI - Otimização NCM

```python
# Implementado em fastapi/routers/ncm_validation.py
```

- [x] Otimizar endpoint de busca rápida
- [x] Implementar cache Redis
- [x] Adicionar validação de dados
- [x] Melhorar tratamento de erros

**Review Point 3.1**:

- [x] Estrutura de validação de dados implementada
- [x] Sistema de enriquecimento de resultados adicionado
- [x] Análise de consistência de códigos NCM
- [x] Cálculo de confiança baseado em múltiplos fatores
- [x] Metadados para rastreabilidade da validação
- [x] Realizar testes com dados reais
- [x] Otimizar tempo de resposta
- [x] Implementar cache de validação

**Próximos Passos**:

1. ~~Testar com consultas complexas~~ ✅
2. ~~Otimizar algoritmo de extração de códigos NCM~~
3. ~~Adicionar mais regras específicas para validação~~

**Atualizações**:

- Implementados testes funcionais e de desempenho para validação NCM
- Otimizado o tempo de resposta para consultas complexas
- Adicionadas regras específicas para validação de diferentes tipos de produtos

### 3.2 Node.js - Deep Research Integration

```typescript
// Implementado em buscador_inteligente/src/services/deep-research-service.ts e routes/deep-research-routes.ts
```

- [x] Implementar integração com FastAPI
- [x] Configurar processamento assíncrono
- [x] Adicionar validação profunda
- [x] Implementar cache de resultados

**Review Point 3.2**:

- [x] Serviço implementado como singleton
- [x] Sistema de passos de pesquisa sequenciais
- [x] Integração com endpoints FastAPI
- [x] Streaming de atualizações via SSE
- [x] Seleção automática de modelo baseada em complexidade
- [x] Rotas de API para gerenciamento de pesquisas
- [x] Testes de integração end-to-end
- [x] Verificar performance com múltiplas requisições

**Atualizações**:

- Implementada seleção automática de modelo baseada na complexidade da consulta
- Adicionado sistema de passos de pesquisa com feedback em tempo real
- Criada API RESTful para gerenciamento de pesquisas profundas
- Integração com sistema SSE para streaming de atualizações
- Implementados testes de integração e processamento paralelo para Deep Research
- Validado desempenho com múltiplas requisições concorrentes

## Etapa 4: Frontend - UI/UX

**Objetivo**: Implementar interface para múltiplos modelos e feedback visual baseado na análise da UI do Jina.

### 4.1 ChatPage - Melhorias

```typescript
// Implementado em frontend/src/pages/ChatPage/index.tsx e componentes relacionados
```

- [x] Implementar ThinkingSection para expandir/colapsar pensamento do modelo
- [x] Adicionar ModelIndicator para mostrar qual modelo gerou cada resposta
- [x] Melhorar exibição de referências com agrupamento por domínio
- [x] Adicionar botões de ação contextual dentro das mensagens (copiar, regenerar)
- [x] Implementar animação de "thinking" mais sutil e eficiente
- [x] Melhorar visualização de código com highlight de sintaxe aprimorado
- [x] Adicionar indicador discreto de status da conexão SSE

**Review Point 4.1**:

- [x] Verificar integração visual com o design system existente
- [x] Confirmar que não houve alterações bruscas no CSS
- [x] Garantir que a experiência do usuário foi aprimorada
- [x] Testar se todos os modelos são corretamente indicados na interface

### 4.1.1 Otimização de Interface na ChatPage

```typescript
// Implementado em frontend/src/pages/ChatPage/index.tsx, frontend/src/components/ConnectionIndicator e estilos relacionados
```

- [x] Remover componente ActionsList redundante
- [x] Integrar DeepResearchProgress no lugar da barra lateral
- [x] Otimizar layout para uso do espaço completo da tela
- [x] Adicionar ConnectionIndicator compacto no canto superior direito
- [x] Ajustar CSS para comportamento responsivo da área de mensagens
- [x] Corrigir estilos usando tokens CSS conforme design system

**Review Point 4.1.1**:

- [x] Layout da área de mensagens ocupa todo o espaço disponível
- [x] DeepResearchProgress exibe corretamente o progresso das etapas
- [x] ConnectionIndicator mostra status da conexão de forma discreta
- [x] Estilização usa corretamente tokens CSS do projeto
- [x] Componentes redundantes foram removidos
- [x] Sistema de layout mantém-se responsivo e acessível

**Atualizações**:

- Removido ActionsList que consumia espaço lateral e era redundante
- Substituído pela integração completa do DeepResearchProgress
- Ajustado ConnectionIndicator para ser mais compacto e usar tokens CSS
- Corrigido problema de useEffect no componente ChatMessage para usar corretamente dependências
- Otimizado layout para melhor aproveitamento do espaço, removendo sidebar desnecessária
- Atualizado CSS para seguir as regras de design system do projeto com tokens

### 4.1.2 Testes de Sincronização e Renderização

```typescript
// Implementado nos componentes SSE, DeepResearchProgress e ferramentas de teste
```

- [x] Adicionar instrumentação para testes na ChatPage
- [x] Implementar logging de eventos SSE para análise de sincronização
- [x] Criar ferramentas para monitorar mudanças no componente DeepResearchProgress
- [x] Desenvolver plano de testes detalhado para verificação manual
- [x] Criar procedimentos para documentação de evidências

**Review Point 4.1.2**:

- [x] Logging detalhado de eventos SSE implementado
- [x] Monitoramento de mudanças no DeepResearchProgress
- [x] Plano de testes estruturado para validação da interface
- [x] Procedimento passo a passo para execução de testes
- [x] Modelo para documentação de resultados e evidências

**Atualizações**:

- Adicionada pasta `testes-manuais` com estrutura completa para testes
- Implementados logs condicionais para eventos SSE (apenas em ambiente de desenvolvimento)
- Adicionado monitoramento detalhado de mudanças no componente DeepResearchProgress
- Criado sistema para ativar/desativar logging de debug através de localStorage
- Desenvolvidos procedimentos para testar a sincronização entre backend e frontend
- Criado modelo para documentação de evidências e resultados

### 4.1.3 Diferenciação de Tipos de Mensagens no Chat

```typescript
// Implementado em frontend/src/pages/ChatPage/index.tsx e frontend/src/components/ChatMessage/index.tsx
```

- [x] Analisar os diferentes tipos de mensagens recebidas da API
- [x] Identificar os componentes específicos para cada tipo de mensagem
- [x] Atualizar o transformador de mensagens para identificar corretamente cada tipo
- [x] Modificar o tratamento de eventos SSE para separar os diferentes tipos de conteúdo
- [x] Atualizar o componente ChatMessage para exibir adequadamente cada tipo de mensagem
- [x] Estilizar cada tipo de mensagem de acordo com seu conteúdo e propósito
- [x] Adicionar suporte para novos tipos de mensagens ("progress", "thinking", etc.)

**Review Point 4.1.3**:

- [x] Cada tipo de mensagem (answer, reflect, search, etc.) tem tratamento específico
- [x] O processamento de mensagens preserva todos os dados relevantes
- [x] A interface visual distingue claramente os diferentes tipos de conteúdo
- [x] As mensagens são exibidas de forma concisa e legível
- [x] O código segue os padrões estabelecidos de tipagem e estrutura
- [ ] Testes realizados para validar o comportamento com diferentes tipos de mensagens

**Implementação em Etapas**:

1. **Atualização dos Tipos**: Adicionar novos tipos como "progress", "thinking" aos tipos válidos nas interfaces Message e ChatMessageProps.
2. **Processamento de Eventos SSE**: Substituir o sistema de processamento de mensagens no ChatPage por uma abordagem baseada em switch-case, que trata cada tipo de mensagem de forma específica.
3. **Extração de Dados**: Implementar extração de dados específicos para cada tipo de mensagem (think, answer, references, questionsToAnswer, etc.).
4. **Formatação Visual**: Atualizar ChatMessage para renderizar componentes específicos com base no tipo e os dados da mensagem.
5. **Estilização**: Criar estilos específicos para cada tipo de mensagem para melhorar a legibilidade e a distinção entre os tipos.
6. **Testes**: Realizar testes com diferentes tipos de mensagens para validar o comportamento correto.

**Status Atual**:

- [x] Análise dos tipos de mensagens e estrutura existente
- [x] Identificação de componentes existentes (ThinkingSection, ReferencesSection)
- [x] Atualização dos tipos para suportar novos formatos de mensagens
- [x] Implementação do novo processador de mensagens
- [ ] Testes e validação do comportamento

**Próximos Passos**:

1. ~~Finalizar a tipagem das mensagens (incluir "progress" nos tipos válidos)~~ ✅
2. ~~Implementar a lógica de processamento por tipo de mensagem~~ ✅
3. ~~Atualizar o componente ChatMessage para exibir adequadamente cada tipo~~ ✅
4. Testar com diferentes tipos de respostas da API
5. Documentar o comportamento e o fluxo de dados

**Melhorias Implementadas**:

1. **Processamento de Mensagens**: Cada tipo de mensagem agora tem um tratamento específico, preservando todos os dados relevantes.
2. **Visualização Aprimorada**: Mensagens são exibidas com formatação específica para seu tipo, facilitando a leitura.
3. **Componentes Reutilizáveis**: Utilização de ThinkingSection para exibir o raciocínio do modelo em diferentes contextos.
4. **Estilização Consistente**: Cada tipo de mensagem tem estilos visuais distintos, mantendo a consistência com o design system.
5. **Tratamento de Progresso**: Adicionado suporte para mensagens de tipo "progress", importantes para feedback durante operações longas.

### 4.1.4 Sistema Avançado de Organização e Exibição de Mensagens no Chat

```typescript
// A ser implementado em frontend/src/pages/ChatPage/index.tsx, frontend/src/components/ChatMessage/index.tsx e novos componentes específicos
```

- [ ] Desenvolver um sistema para filtrar mensagens técnicas e de debug
- [ ] Implementar agrupamento inteligente de mensagens por contexto e tipo
- [ ] Criar componentes especializados para cada categoria de mensagem (pensamento, resposta, erro, etc.)
- [ ] Implementar tratamento robusto de erros para evitar exposição de falhas técnicas ao usuário
- [ ] Desenvolver um sistema de formatação avançada para conteúdo JSON e markdown
- [ ] Adicionar controles de visualização para alternar entre modos (técnico, simplificado)

**Review Point 4.1.4**:

- [ ] Mensagens técnicas e de sistema são filtradas ou agrupadas separadamente
- [ ] Diferentes tipos de respostas (pensamento, reflexão, resposta final) são claramente separados
- [ ] Conteúdo JSON é processado e exibido de forma amigável ao usuário
- [ ] Erros são tratados elegantemente sem expor detalhes técnicos
- [ ] Mensagens de progresso são agrupadas logicamente
- [ ] Interface oferece opções para visualizar detalhes técnicos quando necessário

**Implementação em Etapas**:

1. **Identificação e Categorização de Mensagens**:

   - Analisar todos os possíveis tipos de mensagens recebidas da API
   - Classificar em categorias principais: sistema, progresso, pensamento, resposta, erro
   - Definir hierarquia de exibição e regras de agrupamento

2. **Filtro Inteligente de Mensagens**:

   - Implementar sistema para filtrar mensagens técnicas e de debug
   - Criar regras para determinar quais mensagens devem ser exibidas ao usuário
   - Desenvolver método para agrupar mensagens relacionadas (ex: várias etapas de pensamento)

3. **Componentes Especializados**:

   - Criar ChatMessageGroup para agrupar mensagens relacionadas
   - Desenvolver ThoughtSequence para mostrar sequência de pensamentos
   - Implementar JsonViewer para formatação amigável de dados JSON
   - Criar ErrorMessage para exibição elegante de erros

4. **Tratamento de Erros**:

   - Implementar sistema robusto para capturar e processar erros
   - Criar mensagens de erro amigáveis ao usuário
   - Adicionar opção para ver detalhes técnicos quando necessário

5. **Processamento de Formato**:

   - Melhorar processamento de markdown nas mensagens
   - Implementar formatação específica para estruturas JSON
   - Adicionar suporte para syntax highlighting em blocos de código

6. **Controles de Visualização**:
   - Adicionar toggles para alternar entre modos de visualização (técnico, simplificado)
   - Implementar controles para expandir/colapsar grupos de mensagens
   - Criar opções de filtragem para focar em tipos específicos de mensagens

**Status Atual**:

- [ ] Análise inicial dos problemas e necessidades
- [ ] Planejamento da arquitetura de componentes
- [ ] Definição de categorias de mensagens

**Próximos Passos**:

1. Realizar análise detalhada das mensagens nos logs existentes
2. Definir estrutura de componentes e hierarquia
3. Implementar filtro inicial de mensagens de sistema e técnicas
4. Criar protótipo de ChatMessageGroup
5. Testar com dados reais do sistema

### 4.2 HomePage - Melhorias

```typescript
// Em implementação em frontend/src/pages/HomePage/index.tsx e componentes relacionados
```

- [x] Implementar DeepResearchProgress para visualização do progresso da análise
- [ ] Adicionar exibição em tempo real das etapas do DeepResearch
- [ ] Implementar comparação visual entre resultado inicial e aprofundado
- [ ] Adicionar tooltips informativos sobre capacidades de cada modelo
- [ ] Melhorar indicadores de confiança para resultados de classificação
- [ ] Implementar transições suaves entre estados (carregando, resultados, erro)
- [ ] Adicionar feedback visual sobre qual modelo gerou cada resultado

**Review Point 4.2**:

- [ ] Verificar coerência visual com o resto da aplicação
- [ ] Garantir que o DeepResearch funciona com todos os modelos selecionáveis
- [ ] Testar a usabilidade das novas funcionalidades
- [ ] Confirmar que as melhorias são consistentes em diferentes tamanhos de tela

**Próximos Passos**:

1. Concluir integração do DeepResearchProgress na HomePage
2. Implementar visualização de confiança e resultados comparativos
3. Adicionar tooltips informativos sobre os modelos
4. Melhorar transições e feedback visual dos estados

### 4.3 Componentes Compartilhados

```typescript
// Implementado em frontend/src/components/
```

- [x] Criar ThinkingSection para exibir o "pensamento" do modelo
- [x] Desenvolver ModelIndicator para identificar o modelo usado
- [x] Implementar ReferencesSection para melhorar visualização de fontes
- [x] Criar DeepResearchProgress para mostrar progresso da análise
- [x] Melhorar componentes existentes para manter consistência visual

**Review Point 4.3**:

- [x] Verificar reusabilidade dos componentes
- [x] Garantir que os componentes seguem as boas práticas de React
- [x] Testar integração com a estrutura existente
- [x] Confirmar acessibilidade dos novos componentes

**Atualizações**:

- ThinkingSection implementado com animação suave e toggle para expandir/recolher
- ModelIndicator criado com suporte aos diferentes modelos (GPT4, Claude, Gemini, etc.)
- ReferencesSection desenvolvido para exibir fontes agrupadas por domínio
- DeepResearchProgress implementado como alternativa mais compacta à sidebar
- ConnectionIndicator implementado para feedback visual do status da conexão SSE
- Todos os componentes refatorados para usar tokens CSS consistentes
- Adicionada tipagem forte em TypeScript para todos os componentes
- Implementados hooks personalizados para melhorar reutilização de lógica

## Etapa 5: Otimização e Testes

**Objetivo**: Garantir qualidade e performance do sistema.

### 5.1 Performance

```typescript
// TODO: Otimizações gerais
```

- [ ] Implementar cache em múltiplas camadas
- [ ] Otimizar queries Redis
- [ ] Melhorar bundle size
- [ ] Adicionar lazy loading

**Review Point 5.1**:

- Medir métricas de performance
- Verificar uso de memória
- Validar tempos de resposta

### 5.2 Testes e Documentação

```typescript
// Testes implementados e executados com sucesso
```

- [x] Adicionar testes unitários
- [x] Implementar testes E2E
- [x] Atualizar documentação
- [ ] Criar guias de uso

**Review Point 5.2**:

- [x] Verificar cobertura de testes
- [x] Validar documentação
- [ ] Confirmar exemplos de uso

**Atualizações**:

- Criado documento TESTS.md com detalhes sobre todos os testes implementados
- Implementados testes para todos os componentes principais:
  - SSE Backend: testes de estabilidade e desempenho
  - SSE Frontend: testes de renderização e desempenho
  - Validação NCM: testes funcionais e de desempenho
  - Deep Research: testes de integração e processamento paralelo
- Documentação atualizada com instruções de execução e análise de resultados

**Status Atual dos Testes**:

1. **Testes Executados com Sucesso**:

   - `evaluator.test.ts`: Teste de avaliação de respostas
   - `jinaSearch.test.ts`: Testes de busca e validação de query vazia
   - `query-rewriter.test.ts`: Teste de reescrita de queries
   - `brave-search.test.ts`: Testes de busca e tratamento de erros
   - `error-analyzer.test.ts`: Testes de análise de erros com dados reais
   - `search.test.ts`: Teste de validação de query vazia
   - `dedup.test.ts`: Testes de remoção de queries duplicadas

2. **Cobertura de Testes**:

   - Statements: 53.64%
   - Branches: 38.46%
   - Functions: 50.63%
   - Lines: 54.37%

3. **Testes Pulados**:

   - `search.test.ts`: "should perform search with Jina API" (pulado devido a saldo insuficiente)

4. **Próximos Passos**:
   - Aumentar cobertura de testes para atingir o threshold de 80%
   - Implementar testes para componentes com baixa cobertura
   - Adicionar testes de integração para fluxos completos
   - Criar guias de uso com exemplos práticos

### 5.3 Correção de Comunicação SSE Frontend-Backend

**Objetivo**: Resolver problemas de comunicação durante requisições SSE entre o frontend e o backend.

### Problemas Identificados

1. O frontend envia requisições sem o campo `definitive` necessário, resultando em erro de formato inválido do backend.
2. O backend encontra erro ao processar JSON devido a um token inesperado relacionado a funções serializadas.
3. **NOVO**: Persistência de erro `TypeError: response.text is not a function` no arquivo `agent.ts`.

### Soluções Implementadas

#### 1. Middleware para Adicionar Campo `definitive`

Adicionamos um middleware no servidor Express para garantir que todas as requisições POST para `/api/v1/query` incluam o campo `definitive`:

```typescript
// Middleware para adicionar o campo 'definitive' em requisições para /api/v1/query
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === "POST" && req.path === "/api/v1/query" && req.body) {
    // Adiciona o campo 'definitive' se não existir
    if (!req.body.definitive) {
      req.body.definitive = true;
      console.log("Middleware: Campo definitive adicionado à requisição");
    }
  }
  next();
});
```

#### 2. Sanitização de JSON para Evitar Serialização de Funções

Criamos uma função utilitária para sanitizar objetos antes da serialização JSON, evitando erros com funções:

```typescript
// Arquivo: src/utils/sanitize-json.ts
export function sanitizeForJSON(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "function") {
    return "[Function]";
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForJSON(item));
  }

  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = sanitizeForJSON(obj[key]);
    }
  }
  return newObj;
}
```

E modificamos o método `generateContent` na classe `LocalModelClient` para usar esta função:

```typescript
// Sanitiza o resultado para remover funções antes de serializar
const cleanResult = sanitizeForJSON(result);

// Embala a resposta para garantir a consistência do contrato
return {
  response: {
    text: JSON.stringify(cleanResult),
    usageMetadata: result.usage || { totalTokenCount: 0 },
  },
};
```

#### 3. Correção de Métodos que Usam `text()`

Atualizamos os arquivos que usavam o método `text()` para usar a propriedade `text` diretamente:

- `evaluator.ts`
- `query-rewriter.ts`
- `safe-generator.ts`

#### 4. Correção Pendente no arquivo `agent.ts`

Identificamos que ainda existe um erro persistente no arquivo `agent.ts` na linha 772, onde está sendo usado o método `response.text()` como uma função.

**Plano de Correção**:

1. Localizar todas as ocorrências de `text()` no arquivo `agent.ts`
2. Atualizar para usar a propriedade `text` diretamente ou implementar uma verificação de tipo
3. Analisar o comportamento da resposta final com o campo `definitive`
4. Verificar se os prompts estão alterando o formato esperado de resposta

### Status

- [x] Middleware para adicionar campo `definitive` implementado
- [x] Função de sanitização JSON implementada
- [x] Correção de métodos que usam `text()` em alguns arquivos
- [ ] Correção de métodos que usam `text()` no arquivo `agent.ts`
- [ ] Verificação dos prompts e formato de resposta
- [ ] Testes de integração completos

### Próximos Passos

1. Corrigir o arquivo `agent.ts` para lidar corretamente com o retorno `text`
2. Realizar testes para verificar se o erro foi resolvido
3. Analisar logs do servidor para identificar possíveis problemas no formato de prompts
4. Atualizar a documentação com as soluções implementadas

### 5.4 Melhoria no Tratamento de Mensagens SSE

**Objetivo**: Simplificar e padronizar o formato das mensagens SSE entre backend e frontend.

#### 5.4.1 Diagnóstico do Problema

**Situação Atual**:

```typescript
// Formato atual recebido do backend
event: answer
data: {
  "state": {
    "thisStep": {
      "answer": "Esta é uma resposta de teste para verificar o middleware.",
      "references": [
        {
          "url": "https://exemplo.com/teste",
          "exactQuote": "Citação de exemplo para teste"
        }
      ]
    }
  }
}

// Formato desejado no frontend
{
  "type": "answer",
  "content": "Esta é uma resposta de teste para verificar o middleware.",
  "references": [
    {
      "url": "https://exemplo.com/teste",
      "quote": "Citação de exemplo para teste"
    }
  ]
}
```

#### 5.4.2 Plano de Implementação

1. **Padronização de Tipos**:

   ```typescript
   // shared-types/src/stream/types.ts
   export interface StreamMessageBase {
     type: StreamMessageType;
     content: string;
     references?: Reference[];
     metadata?: {
       model?: string;
       timestamp?: string;
       confidence?: number;
     };
   }

   export interface Reference {
     url: string;
     quote: string;
     title?: string;
   }

   export type StreamMessageType =
     | "answer"
     | "thinking"
     | "progress"
     | "error"
     | "search"
     | "visit";
   ```

2. **Transformador de Mensagens**:

   ```typescript
   // shared-types/src/stream/transformers.ts
   export function transformStreamMessage(message: any): StreamMessageBase {
     // Validar tipo da mensagem
     if (!message || !message.type) {
       throw new Error("Mensagem inválida: tipo não especificado");
     }

     // Extrair conteúdo baseado no tipo
     let content = "";
     let references: Reference[] = [];

     switch (message.type) {
       case "answer":
         content = message.state?.thisStep?.answer || "";
         references = transformReferences(message.state?.thisStep?.references);
         break;
       case "thinking":
         content = message.state?.thisStep?.thought || "";
         break;
       case "progress":
         content = message.state?.thisStep?.status || "";
         break;
       // ... outros casos
     }

     return {
       type: message.type,
       content,
       references,
       metadata: {
         timestamp: new Date().toISOString(),
         model: message.metadata?.model,
       },
     };
   }
   ```

3. **Middleware no Backend**:

   ```typescript
   // buscador_inteligente/src/middleware/streamMessageFormatter.ts
   export function formatStreamMessage(type: string, data: any) {
     return {
       type,
       content: extractContent(type, data),
       references: extractReferences(data),
       metadata: {
         timestamp: new Date().toISOString(),
         model: data.metadata?.model,
       },
     };
   }
   ```

4. **Atualização do Componente ChatMessage**:
   ```typescript
   // frontend/src/components/ChatMessage/types.ts
   export interface ChatMessageProps {
     type: StreamMessageType;
     content: string;
     references?: Reference[];
     metadata?: {
       model?: string;
       timestamp?: string;
     };
   }
   ```

#### 5.4.3 Etapas de Implementação

1. **Fase 1: Preparação**

   - [ ] Criar branch `feature/stream-message-format`
   - [ ] Atualizar documentação de tipos
   - [ ] Criar testes unitários para novos transformadores

2. **Fase 2: Backend**

   - [ ] Implementar middleware de formatação
   - [ ] Atualizar serviços que emitem eventos SSE
   - [ ] Adicionar validação de formato
   - [ ] Testar integração com modelos existentes

3. **Fase 3: Frontend**

   - [ ] Atualizar transformadores de mensagem
   - [ ] Modificar componentes para novo formato
   - [ ] Implementar tratamento de erros
   - [ ] Adicionar logs de debug

4. **Fase 4: Testes e Validação**
   - [ ] Executar testes end-to-end
   - [ ] Validar formato das mensagens
   - [ ] Verificar performance
   - [ ] Documentar mudanças

#### 5.4.4 Benefícios Esperados

1. **Simplicidade**:

   - Formato de mensagem mais limpo e direto
   - Menos transformações de dados
   - Menor complexidade no código

2. **Manutenibilidade**:

   - Tipos bem definidos
   - Validação em tempo de compilação
   - Melhor rastreabilidade de erros

3. **Performance**:
   - Menos processamento de dados
   - Menor payload de rede
   - Resposta mais rápida no frontend

#### 5.4.5 Riscos e Mitigações

1. **Compatibilidade**:

   - **Risco**: Quebrar integrações existentes
   - **Mitigação**: Implementar gradualmente com feature flags

2. **Performance**:

   - **Risco**: Overhead do middleware
   - **Mitigação**: Implementar caching e otimizações

3. **Complexidade**:
   - **Risco**: Aumentar complexidade inicial
   - **Mitigação**: Documentação clara e testes abrangentes

#### 5.4.6 Métricas de Sucesso

1. **Qualidade**:

   - Cobertura de testes > 90%
   - Zero erros de tipo em produção
   - Redução de 50% nos bugs relacionados a formato

2. **Performance**:

   - Tempo de processamento < 50ms
   - Tamanho médio de mensagem reduzido em 30%
   - Zero timeouts em produção

3. **Desenvolvimento**:
   - Redução de 40% no código de transformação
   - Aumento de 30% na velocidade de desenvolvimento
   - Redução de 50% nas dúvidas sobre formato

#### 5.4.7 Timeline Estimada

1. **Fase 1**: 2 dias

   - Documentação e setup inicial
   - Criação de testes

2. **Fase 2**: 3 dias

   - Implementação no backend
   - Testes de integração

3. **Fase 3**: 3 dias

   - Implementação no frontend
   - Testes de componentes

4. **Fase 4**: 2 dias
   - Testes end-to-end
   - Documentação final

**Total**: 10 dias úteis

#### 5.4.8 Próximos Passos

1. Revisão do plano pela equipe
2. Aprovação das mudanças propostas
3. Criação das tasks no sistema de gestão
4. Início da implementação por fases

## Regras de Implementação

1. **Dependências**:

   - Usar bibliotecas existentes
   - Avaliar necessidade antes de adicionar novas
   - Manter compatibilidade de versões

2. **Código**:

   - Seguir padrões existentes
   - Usar TypeScript strict mode
   - Documentar funções e interfaces
   - Manter consistência de estilo

3. **Revisão**:

   - Revisar cada subetapa antes de prosseguir
   - Garantir qualidade do código
   - Validar performance
   - Verificar compatibilidade

4. **Testes**:
   - Implementar testes unitários
   - Adicionar testes de integração
   - Validar casos de erro
   - Testar performance

## Ordem de Execução

1. Começar com Etapa 1 (Infraestrutura)
2. Implementar Etapa 2 (SSE)
3. Desenvolver Etapa 3 (Integração)
4. Realizar Etapa 4 (Frontend)
5. Finalizar com Etapa 5 (Otimização)

**Importante**: Cada etapa deve ser revisada e aprovada antes de prosseguir para a próxima.

## Métricas de Sucesso

1. **Performance**:

   - Tempo de resposta < 200ms para busca rápida
   - Latência SSE < 50ms
   - Bundle size < 500KB

2. **Qualidade**:

   - Cobertura de testes > 80%
   - Zero memory leaks
   - Typescript strict compliance

3. **UX**:
   - Tempo de carregamento < 1s
   - Feedback visual imediato
   - Zero falhas de conexão SSE
