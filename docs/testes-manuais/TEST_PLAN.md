# Plano de Testes: ChatPage e DeepResearchProgress

## Objetivo

Verificar a sincronização entre as ações do backend, o componente DeepResearchProgress e a renderização de mensagens na interface do ChatPage.

## Casos de Teste

### Caso 1: Renderização de Mensagens Durante a Pesquisa

**Objetivo**: Verificar se as mensagens de cada etapa da pesquisa são renderizadas corretamente no chat.

**Passos**:

1. Acessar a página de chat
2. Inserir uma consulta complexa (ex: "Como classificar um aspirador de pó robô no NCM?")
3. Iniciar a pesquisa
4. Observar as mensagens sendo exibidas durante o processo
5. Capturar screenshots de cada etapa

**Resultados Esperados**:

- Cada etapa da pesquisa deve gerar uma mensagem no chat
- As mensagens devem ter o formato e estilos corretos
- O status "digitando" deve ser exibido durante a geração de resposta
- As referências devem ser exibidas corretamente nas mensagens
- O modelo utilizado deve ser indicado nas respostas

### Caso 2: Sincronização do DeepResearchProgress com Ações do Backend

**Objetivo**: Confirmar que o componente DeepResearchProgress reflete com precisão as etapas executadas pelo backend.

**Passos**:

1. Acessar a página de chat
2. Iniciar uma pesquisa que utilize o DeepResearch
3. Observar os passos sendo atualizados no componente DeepResearchProgress
4. Simultaneamente, monitorar os logs do backend ou eventos SSE
5. Comparar a ordem e tempo dos passos no frontend com as ações no backend

**Resultados Esperados**:

- O DeepResearchProgress deve mostrar o mesmo número de etapas definidas no backend
- A transição entre etapas deve ocorrer em sincronia com as mudanças no backend
- A porcentagem de progresso deve ser calculada corretamente
- O status (waiting, current, completed) deve ser atualizado adequadamente para cada etapa

### Caso 3: Verificação de Erros e Reconexões

**Objetivo**: Testar como o sistema lida com erros ou interrupções durante a pesquisa.

**Passos**:

1. Iniciar uma pesquisa longa
2. Simular uma desconexão temporária do servidor (pausando o servidor por alguns segundos)
3. Observar o comportamento do ConnectionIndicator
4. Verificar se a pesquisa continua após reconexão
5. Verificar o comportamento das mensagens e do DeepResearchProgress durante a reconexão

**Resultados Esperados**:

- O ConnectionIndicator deve mudar para o estado "reconnecting"
- O DeepResearchProgress deve manter o estado atual durante a desconexão
- Após reconexão, o progresso deve ser retomado do ponto correto
- Mensagens parcialmente recebidas devem ser completadas corretamente

## Métricas de Avaliação

1. **Tempo de Resposta**:

   - Tempo entre o início da pesquisa e a exibição da primeira mensagem
   - Tempo médio entre etapas consecutivas
   - Tempo total da pesquisa

2. **Precisão de Sincronização**:

   - Porcentagem de passos refletidos corretamente entre backend e frontend
   - Atraso médio (ms) entre ação no backend e atualização no frontend

3. **Qualidade da Renderização**:
   - Verificação de erros visuais nas mensagens (layout, estilos)
   - Teste de responsividade em diferentes tamanhos de tela

## Ferramentas e Métodos

1. **Captura Visual**:

   - Screenshots para cada etapa principal
   - Gravação de vídeo da interação completa (opcional)

2. **Logs**:

   - Logs do backend contendo timestamps de cada ação
   - Logs de eventos SSE recebidos pelo frontend
   - Console.log customizado no componente DeepResearchProgress

3. **Métricas de Desempenho**:
   - DevTools do navegador para monitorar performance
   - Tempo de renderização de componentes
