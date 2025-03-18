# Procedimento de Teste - ChatPage e DeepResearchProgress

Este documento apresenta o procedimento detalhado para realizar os testes manuais e coletar evidências da sincronização entre o backend e o frontend.

## Preparação do Ambiente

1. **Iniciar Servidores**

   ```bash
   # Terminal 1: Iniciar o frontend
   cd frontend && pnpm dev

   # Terminal 2: Iniciar o backend
   cd buscador_inteligente && pnpm dev
   ```

2. **Ativar Modo Debug**

   - Abra o navegador e acesse `http://localhost:3000/chat`
   - Abra as ferramentas de desenvolvedor (F12 ou Cmd+Option+I)
   - Na aba Console, copie e cole o conteúdo do script `testes-manuais/ativar-debug.js`
   - Confirme a mensagem "Debug de testes ativado!"

3. **Preparar Ferramentas de Captura**
   - Tenha pronto um software de captura de tela (como Loom, OBS ou similar)
   - Prepare uma planilha para registrar os tempos de cada etapa

## Execução dos Testes

### Teste 1: Verificação de Renderização de Mensagens

1. **Consulta Simples**

   - Digite uma consulta simples: "O que é NCM?"
   - Envie a consulta e observe:
     - O tempo até a primeira mensagem aparecer
     - A animação de digitação durante a resposta
     - O formato das mensagens de cada etapa
     - A exibição do indicador de modelo
   - Capture screenshots de cada etapa

2. **Consulta Complexa**
   - Digite uma consulta complexa: "Como classificar um aspirador de pó robô no NCM?"
   - Observe e registre:
     - A exibição do componente DeepResearchProgress
     - A transição entre os diferentes estados
     - A exibição das referências na resposta final

### Teste 2: Sincronização DeepResearchProgress

1. **Monitoramento de Eventos**

   - Abra as ferramentas de desenvolvedor (F12)
   - Filtre o console para mostrar apenas os logs relacionados:
     - Digite `SSE` ou `DeepResearchProgress` na caixa de filtro
   - Inicie a gravação do console (se disponível)

2. **Executar Pesquisa Profunda**

   - Digite: "Quero uma análise detalhada sobre como classificar bomba de água no NCM"
   - Envie e observe:
     - Os eventos SSE sendo recebidos
     - As mudanças no componente DeepResearchProgress
     - A correlação entre eventos e atualizações visuais

3. **Verificar Sincronização**
   - Compare os timestamps dos eventos SSE com as atualizações visuais
   - Verifique se cada etapa no backend corresponde a uma atualização no DeepResearchProgress
   - Meça o atraso entre o evento e a atualização visual

### Teste 3: Recuperação de Erros

1. **Simulação de Desconexão**

   - Inicie uma pesquisa longa: "Faça uma análise completa sobre classificação fiscal de relógios"
   - Quando estiver em andamento (após ~15 segundos), pause o servidor backend (Ctrl+C)
   - Observe o comportamento do ConnectionIndicator
   - Após 5 segundos, reinicie o servidor
   - Observe se a pesquisa é retomada corretamente

2. **Análise de Comportamento**
   - Registre o estado do DeepResearchProgress durante a desconexão
   - Verifique se as mensagens parciais são completadas após reconexão
   - Documente qualquer comportamento inesperado

## Coleta de Evidências

Para cada teste, coletar:

1. **Capturas de Tela**

   - Screenshots de cada etapa principal
   - Gravação da interação completa (quando possível)

2. **Logs**

   - Exportar logs do console para um arquivo JSON ou texto
   - Salvar em `testes-manuais/logs/[data]_[teste].log`

3. **Métricas**
   - Tempo para primeira resposta
   - Tempo médio entre etapas
   - Atraso entre eventos e atualizações visuais

## Formato do Relatório

Ao concluir os testes, criar um relatório com:

1. **Resumo Executivo**

   - Visão geral dos testes realizados
   - Principais descobertas

2. **Resultados Detalhados**

   - Análise de cada caso de teste
   - Evidências coletadas (com links para arquivos)
   - Métricas coletadas

3. **Problemas Identificados**

   - Listar quaisquer problemas encontrados
   - Classificar por severidade
   - Sugerir possíveis correções

4. **Conclusão**
   - Avaliação geral da sincronização
   - Recomendações para melhorias

Salvar o relatório em `testes-manuais/RELATORIO_[data].md`
