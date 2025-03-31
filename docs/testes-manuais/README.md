# Testes Manuais - ChatPage e DeepResearchProgress

Esta pasta contém recursos para realizar testes manuais da sincronização entre o backend e a interface do usuário.

## Arquivos

- `TEST_PLAN.md` - Plano de testes detalhado
- `PROCEDIMENTO_TESTE.md` - Instruções para execução
- `MODELO_RELATORIO.md` - Template para documentar resultados
- `ativar-debug.js` - Script para ativar modo debug
- `logs/` - Diretório para evidências

## Estrutura de Arquivos

- `TEST_PLAN.md` - Plano de testes detalhado com casos de teste
- `PROCEDIMENTO_TESTE.md` - Instruções passo a passo para realizar os testes
- `MODELO_RELATORIO.md` - Modelo para documentar os resultados dos testes
- `ativar-debug.js` - Script para ativar o modo de debug durante os testes
- `logs/` - Diretório para armazenar logs e evidências dos testes

## Como Realizar os Testes

1. **Preparação:**

   - Iniciar os servidores de frontend e backend
   - Ativar o modo debug executando o script `ativar-debug.js` no console do navegador
   - Preparar ferramentas de captura de tela

2. **Execução:**

   - Seguir as instruções no arquivo `PROCEDIMENTO_TESTE.md`
   - Realizar os casos de teste especificados no `TEST_PLAN.md`
   - Coletar evidências (screenshots, logs, etc.)

3. **Documentação:**
   - Usar o `MODELO_RELATORIO.md` como base para documentar os resultados
   - Salvar o relatório como `RELATORIO_[DATA].md`
   - Armazenar logs e evidências no diretório `logs/`

## Objetivo dos Testes

Os testes têm como objetivo verificar:

1. A correta renderização das mensagens durante a pesquisa
2. A sincronização precisa entre as ações do backend e as atualizações visuais no DeepResearchProgress
3. O comportamento do sistema em caso de erros ou desconexões temporárias

## Métricas Chave

Durante os testes, as seguintes métricas devem ser coletadas:

- **Tempo de resposta**: Latência entre solicitação e primeiras mensagens
- **Sincronização**: Atraso entre eventos no backend e atualizações na UI
- **Qualidade visual**: Consistência e correção da renderização
- **Resiliência**: Capacidade de recuperação após falhas de conexão
