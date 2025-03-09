# Teste de Fluxo Real Completo - fluxo-real-completo-2025-03-07T18-38-20.138Z

## Sistema Completo com Jina Search, Agent.ts e Server.ts

### Informações do Teste

- **Descrição:** Camisa Polo - Fluxo Completo com Jina Search
- **Consulta:** "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."
- **NCM Esperado:** 6105.10.00
- **Modelo:** gemini-1.5-pro

### Logs de Execução

- [2025-03-07T18:38:20.139Z] Iniciando teste de fluxo real completo
- [2025-03-07T18:38:20.141Z] ID de Sessão: bf1059f7-fb01-4d39-a626-17cb23a1ddc3
- [2025-03-07T18:38:20.141Z] Compilando o código TypeScript...
- [2025-03-07T18:38:22.047Z] Erro na compilação: Command failed: pnpm build

- [2025-03-07T18:38:22.047Z] Continuando com a versão compilada existente...
- [2025-03-07T18:38:22.047Z] Verificando conexão com o servidor...
- [2025-03-07T18:38:22.063Z] Erro ao conectar com o servidor: 
- [2025-03-07T18:38:22.063Z] Iniciando servidor Express...
- [2025-03-07T18:38:22.369Z] Servidor encerrado com código 1
- [2025-03-07T18:38:24.371Z] Verificando conexão com o servidor...
- [2025-03-07T18:38:24.376Z] Erro ao conectar com o servidor: 
- [2025-03-07T18:38:24.376Z] 
❌ Erro fatal durante o teste: Não foi possível conectar ao servidor após iniciá-lo

### Pesquisas com Jina

*Nenhuma pesquisa Jina foi registrada*

### Pensamentos do Modelo

*Nenhum pensamento do modelo foi registrado*

### Ações Tomadas pelo Agente

*Nenhuma ação foi registrada*

### URLs Visitadas

*Nenhuma URL foi visitada*

### Comunicação em Tempo Real (WebSocket)

*Nenhuma mensagem WebSocket foi registrada*

### Logs do Servidor

```
Modo de modelo: Local
Endpoint local bruto: http://localhost:1234
Endpoint local normalizado: http://localhost:1234
Endpoint local validado com sucesso
Configuration Summary: {
  "provider": {
    "name": "gemini",
    "model": "gemini-2.0-flash"
  },
  "search": {
    "provider": "jina"
  },
  "tools": {
    "coder": {
      "model": "gemini-2.0-flash",
      "temperature": 0.7,
      "maxTokens": 8000
    },
    "searchGrounding": {
      "model": "gemini-2.0-flash",
      "temperature": 0,
      "maxTokens": 8000
    },
    "dedup": {
      "model": "gemini-2.0-flash",
      "temperature": 0.1,
      "maxTokens": 8000
    },
    "evaluator": {
      "model": "gemini-2.0-flash",
      "temperature": 0,
      "maxTokens": 8000
    },
    "errorAnalyzer": {
      "model": "gemini-2.0-flash",
      "temperature": 0,
      "maxTokens": 8000
    },
    "queryRewriter": {
      "model": "gemini-2.0-flash",
      "temperature": 0.1,
      "maxTokens": 8000
    },
    "agent": {
      "model": "gemini-2.0-flash",
      "temperature": 0.7,
      "maxTokens": 8000
    },
    "agentBeastMode": {
      "model": "gemini-2.0-flash",
      "temperature": 0.7,
      "maxTokens": 8000
    },
    "fallback": {
      "model": "gemini-2.0-flash",
      "temperature": 0,
      "maxTokens": 8000
    }
  },
  "defaults": {
    "stepSleep": 0
  }
}
ERROR: node:fs:563
ERROR:   return binding.open(
ERROR:                  ^
ERROR: Error: ENOENT: no such file or directory, open '/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/dist/swagger.yaml'
ERROR:     at Object.openSync (node:fs:563:18)
ERROR:     at Object.readFileSync (node:fs:447:35)
ERROR:     at Utils.getStringFromFile (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/yamljs@0.3.0/node_modules/yamljs/lib/Utils.js:284:19)
ERROR:     at Yaml.parseFile (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/yamljs@0.3.0/node_modules/yamljs/lib/Yaml.js:46:21)
ERROR:     at Yaml.load (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/yamljs@0.3.0/node_modules/yamljs/lib/Yaml.js:78:17)
ERROR:     at Object.<anonymous> (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/dist/swagger.js:10:42)
ERROR:     at Module._compile (node:internal/modules/cjs/loader:1723:14)
ERROR:     at Object..js (node:internal/modules/cjs/loader:1888:10)
ERROR:     at Module.load (node:internal/modules/cjs/loader:1458:32)
ERROR:     at Function._load (node:internal/modules/cjs/loader:1275:12) {
ERROR:   errno: -2,
ERROR:   code: 'ENOENT',
ERROR:   syscall: 'open',
ERROR:   path: '/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/dist/swagger.yaml'
ERROR: }
ERROR: Node.js v23.7.0
```

### Resultados da Consulta

*Nenhum resultado foi registrado*

