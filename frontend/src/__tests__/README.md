# Documentação de Testes - CMEX Frontend

## Visão Geral

Este diretório contém scripts para documentar e avaliar o funcionamento do fluxo de mensagens em tempo real entre o backend e o frontend usando Server-Sent Events (SSE).

Devido a incompatibilidades entre as configurações do TypeScript e do Jest no ambiente atual, optamos por uma abordagem de documentação detalhada e análise do fluxo de dados, em vez de testes automatizados tradicionais.

## Arquivos Principais

- `document_sse_flow.js` - Documenta o fluxo completo de eventos SSE entre backend e frontend
- `simulate_chat_message_tests.js` - Simula testes do componente ChatMessage com diferentes tipos de mensagens
- `generate_final_report.js` - Gera um relatório final consolidado com todas as evidências
- `run_documentation.sh` - Script shell para executar todos os geradores de documentação em sequência

## Como Executar

Para gerar toda a documentação de uma vez, execute:

```bash
cd frontend
./src/__tests__/run_documentation.sh
```

Isso irá:

1. Criar os diretórios necessários para os relatórios
2. Gerar documentação detalhada do fluxo SSE
3. Gerar documentação simulada de testes do ChatMessage
4. Gerar o relatório final consolidado
5. Exibir uma lista de todos os arquivos de documentação gerados

## Estrutura de Arquivos Gerados

Os arquivos de documentação são gerados no diretório `test-reports/evidence/`, com a seguinte estrutura:

```
test-reports/
└── evidence/
    ├── screenshots/                # Contém representações ASCII dos estados dos componentes
    ├── sse_flow_documentation.md   # Documentação detalhada do fluxo de dados SSE
    ├── chat_message_tests.md       # Documentação dos testes do componente ChatMessage
    └── RELATORIO_FINAL.md          # Relatório final consolidado
```

## Manutenção e Atualização

Ao fazer modificações nos componentes relacionados ao fluxo SSE, especialmente no `sseClient.ts` ou nos componentes que consomem eventos SSE (`ChatMessage`, `ConnectionIndicator`, `DeepResearchProgress`), atualize os scripts de documentação para refletir as alterações.

Fluxo recomendado:

1. Faça alterações no código
2. Atualize os scripts de documentação, se necessário
3. Execute `./src/__tests__/run_documentation.sh` para gerar a documentação atualizada
4. Verifique se a documentação reflete corretamente o comportamento atual do sistema

## Extensões Futuras

Quando os problemas de configuração do Jest forem resolvidos, este diretório poderá ser expandido para incluir testes automatizados reais. Os scripts de documentação serão mantidos como uma referência valiosa para entender o fluxo de dados e o comportamento esperado do sistema.

## Notas Importantes

- Os scripts atuais são apenas para fins de documentação e não executam testes automatizados reais
- As capturas de tela são representações ASCII simuladas do estado dos componentes
- Os dados de cobertura apresentados no relatório final são estimativas baseadas na análise manual do código
