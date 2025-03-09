# Implementação do Modo DeepResearch para API NCM

Este documento apresenta um resumo da implementação do modo DeepResearch para a API de consulta NCM.

## Visão Geral

O modo DeepResearch é uma extensão da API de consulta NCM que permite uma análise profunda e validação dos resultados obtidos. O fluxo principal consiste em:

1. Consulta inicial à base de dados via FastAPI
2. Análise profunda dos resultados usando modelos de IA especializados
3. Combinação e enriquecimento dos resultados com metadados de confiança

## Componentes Implementados

### 1. Backend

#### Middleware de Roteamento (`ncmRouter.ts`)

O middleware de roteamento é responsável por determinar qual fluxo seguir com base no parâmetro `useDeepResearch`:

- Se `useDeepResearch=false`, direciona a requisição diretamente para o FastAPI
- Se `useDeepResearch=true`, consulta o FastAPI e encaminha o resultado para processamento adicional
- Se estiver em modo de desenvolvimento com mock ativado, usa o controlador NCM existente

#### Módulo Base DeepResearch (`deepResearch.ts`)

O módulo base implementa:

- Interface comum para todos os modelos de IA
- Lógica de análise de confiança
- Método para combinar resultados do FastAPI com resultados da análise
- Métodos para preparar consultas específicas para cada modelo

#### Controlador DeepResearch (`deepResearchNCM.ts`)

O controlador implementa:

- Classes específicas para cada modelo (GPT-4, Claude, Deepseek, Qwen)
- Factory pattern para criar instâncias apropriadas de acordo com o modelo escolhido
- Gerenciamento de erros e fallbacks
- Metadados de tempo de processamento

#### Rota no Servidor (`server.ts`)

A rota `/api/v1/ncm` foi atualizada para suportar o novo fluxo:

```typescript
app.post('/api/v1/ncm', (req, res, next) => {
  ncmRouter(req, res, next).catch(next);
});
```

### 2. Frontend

#### Componente DeepResearchToggle

Um componente React para ativar/desativar o modo DeepResearch:

- Toggle button cinza/azul claro
- Estado interno controlado
- Texto de ajuda configurável
- Suporte para modo desabilitado

#### Componente NCMConsultaForm

Um formulário completo para consulta NCM:

- Campos para todos os parâmetros necessários
- Integração do toggle DeepResearch
- Visualização formatada dos resultados
- Barra de confiança para resultados com DeepResearch

## Fluxo de Dados

1. **Usuário** submete formulário com `useDeepResearch=true`
2. **Frontend** envia requisição para `/api/v1/ncm`
3. **Middleware** (`ncmRouter`) redireciona para FastAPI
4. **FastAPI** processa a consulta e retorna resultado
5. **DeepResearch** analisa o resultado usando o modelo escolhido
6. **DeepResearch** calcula confiança e enriquece resposta
7. **Frontend** exibe resultado com metadados de confiança

## Diagrama de Arquitetura

```
┌─────────┐    ┌─────────────┐    ┌──────────┐    ┌────────────┐
│ Cliente │───▶│ API Express │───▶│ ncmRouter│───▶│ FastAPI DB │
└─────────┘    └─────────────┘    └─────┬────┘    └──────┬─────┘
                                        │                 │
                                        │                 │
                                        │                 ▼
┌─────────┐    ┌───────────────┐    ┌───┴─────────────────────┐
│ Cliente │◀───│ Resposta JSON │◀───│ DeepResearch Processing │
└─────────┘    └───────────────┘    └───────────────────────┬─┘
                                                            │
                                                            ▼
                                                    ┌───────────────┐
                                                    │ Modelo de IA  │
                                                    └───────────────┘
```

## Vantagens da Implementação

1. **Modular**: Cada componente tem uma responsabilidade clara
2. **Extensível**: Adição de novos modelos é simples (Factory pattern)
3. **Fallbacks**: Em caso de falha do FastAPI, ainda pode processar via IA diretamente
4. **Métricas**: Rastreamento de uso de tokens e tempo de processamento
5. **UX Aprimorada**: Feedback visual da confiança dos resultados
6. **Modo de Desenvolvimento**: Suporte para respostas mockadas facilita testes

## Como Adicionar Novos Modelos

Para adicionar um novo modelo, siga estes passos:

1. Crie uma nova classe no arquivo `deepResearchNCM.ts` que herde de `ModuloDeepResearch`
2. Implemente o método `analisar()` para o novo modelo
3. Adicione o modelo ao factory pattern:

```typescript
const modelFactory: Record<string, (fastApiData: FastApiNCMResult | null, consulta: ConsultaProduto) => ModuloDeepResearch> = {
  // Modelos existentes
  'Novo-Modelo-ID': (fastApiData, consulta) => new NovoModuloDeepResearch('novo-modelo', fastApiData, consulta)
};
```

4. Atualize a documentação e os componentes de UI

## Próximos Passos

- Implementação de sistema de cache para consultas frequentes
- Adição de estatísticas de uso por modelo
- Integração com sistema de logs centralizado
- Exportação dos resultados em vários formatos (CSV, PDF)
- Dashboard para visualização de métricas de uso e precisão 