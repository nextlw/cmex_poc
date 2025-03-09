# Teste de Fluxo Real Completo - fluxo-real-completo-2025-03-07T18-39-46.228Z

## Sistema Completo com Jina Search, Agent.ts e Server.ts

### Informações do Teste

- **Descrição:** Camisa Polo - Fluxo Completo com Jina Search
- **Consulta:** "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado."
- **NCM Esperado:** 6105.10.00
- **Modelo:** gemini-1.5-pro

### Logs de Execução

- [2025-03-07T18:39:46.229Z] Iniciando teste de fluxo real completo
- [2025-03-07T18:39:46.231Z] ID de Sessão: 42e402fb-a191-40ea-9f03-ff2e6b1e7a1b
- [2025-03-07T18:39:46.231Z] Compilando o código TypeScript...
- [2025-03-07T18:39:48.209Z] Erro na compilação: Command failed: pnpm build

- [2025-03-07T18:39:48.209Z] Continuando com a versão compilada existente...
- [2025-03-07T18:39:48.209Z] Verificando conexão com o servidor...
- [2025-03-07T18:39:48.224Z] Erro ao conectar com o servidor: 
- [2025-03-07T18:39:48.224Z] Iniciando servidor Express...
- [2025-03-07T18:39:48.224Z] Usando servidor em: /Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/dist/server.js
- [2025-03-07T18:39:48.397Z] [SERVER-OUT] Modo de modelo: Local
- [2025-03-07T18:39:48.397Z] [SERVER-OUT] Endpoint local bruto: http://localhost:1234
- [2025-03-07T18:39:48.397Z] [SERVER-OUT] Endpoint local normalizado: http://localhost:1234
- [2025-03-07T18:39:48.397Z] [SERVER-OUT] Endpoint local validado com sucesso
- [2025-03-07T18:39:48.398Z] [SERVER-OUT] Configuration Summary: {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]   "provider": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "name": "gemini",
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "model": "gemini-2.0-flash"
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]   },
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]   "search": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "provider": "jina"
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]   },
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]   "tools": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "coder": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "model": "gemini-2.0-flash",
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "temperature": 0.7,
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "maxTokens": 8000
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     },
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "searchGrounding": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "model": "gemini-2.0-flash",
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "temperature": 0,
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "maxTokens": 8000
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     },
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "dedup": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "model": "gemini-2.0-flash",
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "temperature": 0.1,
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "maxTokens": 8000
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     },
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "evaluator": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "model": "gemini-2.0-flash",
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "temperature": 0,
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "maxTokens": 8000
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     },
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "errorAnalyzer": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "model": "gemini-2.0-flash",
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "temperature": 0,
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "maxTokens": 8000
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     },
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "queryRewriter": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "model": "gemini-2.0-flash",
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "temperature": 0.1,
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "maxTokens": 8000
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     },
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "agent": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "model": "gemini-2.0-flash",
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "temperature": 0.7,
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "maxTokens": 8000
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     },
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "agentBeastMode": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "model": "gemini-2.0-flash",
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "temperature": 0.7,
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "maxTokens": 8000
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     },
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "fallback": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "model": "gemini-2.0-flash",
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "temperature": 0,
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]       "maxTokens": 8000
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     }
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]   },
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]   "defaults": {
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]     "stepSleep": 0
- [2025-03-07T18:39:48.398Z] [SERVER-OUT]   }
- [2025-03-07T18:39:48.398Z] [SERVER-OUT] }
- [2025-03-07T18:39:48.516Z] [SERVER-ERR] node:fs:563
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]   return binding.open(
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]                  ^
- [2025-03-07T18:39:48.516Z] [SERVER-ERR] Error: ENOENT: no such file or directory, open '/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/dist/swagger.yaml'
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]     at Object.openSync (node:fs:563:18)
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]     at Object.readFileSync (node:fs:447:35)
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]     at Utils.getStringFromFile (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/yamljs@0.3.0/node_modules/yamljs/lib/Utils.js:284:19)
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]     at Yaml.parseFile (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/yamljs@0.3.0/node_modules/yamljs/lib/Yaml.js:46:21)
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]     at Yaml.load (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/yamljs@0.3.0/node_modules/yamljs/lib/Yaml.js:78:17)
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]     at Object.<anonymous> (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/dist/swagger.js:10:42)
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]     at Module._compile (node:internal/modules/cjs/loader:1723:14)
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]     at Object..js (node:internal/modules/cjs/loader:1888:10)
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]     at Module.load (node:internal/modules/cjs/loader:1458:32)
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]     at Function._load (node:internal/modules/cjs/loader:1275:12) {
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]   errno: -2,
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]   code: 'ENOENT',
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]   syscall: 'open',
- [2025-03-07T18:39:48.516Z] [SERVER-ERR]   path: '/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/dist/swagger.yaml'
- [2025-03-07T18:39:48.516Z] [SERVER-ERR] }
- [2025-03-07T18:39:48.516Z] [SERVER-ERR] Node.js v23.7.0
- [2025-03-07T18:39:48.521Z] Servidor encerrado com código 1
- [2025-03-07T18:39:48.521Z] Erro ao iniciar servidor com Node: Servidor encerrou com código 1
- [2025-03-07T18:39:48.521Z] Tentando iniciar com ts-node como alternativa...
- [2025-03-07T18:39:48.521Z] Tentando iniciar servidor usando ts-node...
- [2025-03-07T18:39:48.521Z] Usando servidor em: /Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/src/server.ts
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR] /Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:859
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]     return new TSError(diagnosticText, diagnosticCodes, diagnostics);
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]            ^
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR] TSError: ⨯ Unable to compile TypeScript:
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR] src/agent.ts(760,52): error TS2345: Argument of type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to parameter of type 'ModelParams & { model: string; generationConfig: any; }'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]   Type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to type 'ModelParams'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]     The types of 'generationConfig.responseSchema' are incompatible between these types.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]       Type 'ResponseSchema' is not assignable to type 'Schema | undefined'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]         Type 'ResponseSchema' is not assignable to type 'SimpleStringSchema | EnumStringSchema | NumberSchema | IntegerSchema | BooleanSchema | ArraySchema | ObjectSchema'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]           Type 'ResponseSchema' is not assignable to type 'ObjectSchema'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]             Types of property 'type' are incompatible.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]               Type 'SchemaType | undefined' is not assignable to type 'SchemaType.OBJECT'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]                 Type 'undefined' is not assignable to type 'SchemaType.OBJECT'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR] src/agent.ts(1253,54): error TS2345: Argument of type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to parameter of type 'ModelParams & { model: string; generationConfig: any; }'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]   Type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to type 'ModelParams'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]     The types of 'generationConfig.responseSchema' are incompatible between these types.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]       Type 'ResponseSchema' is not assignable to type 'Schema | undefined'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]         Type 'ResponseSchema' is not assignable to type 'SimpleStringSchema | EnumStringSchema | NumberSchema | IntegerSchema | BooleanSchema | ArraySchema | ObjectSchema'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]           Type 'ResponseSchema' is not assignable to type 'ObjectSchema'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]             Types of property 'type' are incompatible.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]               Type 'SchemaType | undefined' is not assignable to type 'SchemaType.OBJECT'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]                 Type 'undefined' is not assignable to type 'SchemaType.OBJECT'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR] src/agent.ts(1381,52): error TS2345: Argument of type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to parameter of type 'ModelParams & { model: string; generationConfig: any; }'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]   Type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to type 'ModelParams'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]     The types of 'generationConfig.responseSchema' are incompatible between these types.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]       Type 'ResponseSchema' is not assignable to type 'Schema | undefined'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]         Type 'ResponseSchema' is not assignable to type 'SimpleStringSchema | EnumStringSchema | NumberSchema | IntegerSchema | BooleanSchema | ArraySchema | ObjectSchema'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]           Type 'ResponseSchema' is not assignable to type 'ObjectSchema'.
- [2025-03-07T18:39:50.362Z] [TS-SERVER-ERR]             Types of property 'type' are incompatible.
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]               Type 'SchemaType | undefined' is not assignable to type 'SchemaType.OBJECT'.
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]                 Type 'undefined' is not assignable to type 'SchemaType.OBJECT'.
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]     at createTSError (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:859:12)
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]     at reportTSError (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:863:19)
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]     at getOutput (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:1077:36)
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]     at Object.compile (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:1433:41)
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]     at Module.m._compile (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:1617:30)
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]     at loadTS (node:internal/modules/cjs/loader:1815:10)
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]     at Object.require.extensions.<computed> [as .ts] (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:1621:12)
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]     at Module.load (node:internal/modules/cjs/loader:1458:32)
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]     at Function._load (node:internal/modules/cjs/loader:1275:12)
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]     at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR]   diagnosticCodes: [ 2345, 2345, 2345 ]
- [2025-03-07T18:39:50.363Z] [TS-SERVER-ERR] }
- [2025-03-07T18:39:50.382Z] Servidor ts-node encerrado com código 1
- [2025-03-07T18:39:50.382Z] Erro ao iniciar servidor com ts-node: Servidor ts-node encerrou com código 1
- [2025-03-07T18:39:50.382Z] 
❌ Erro fatal durante o teste: Não foi possível iniciar o servidor de nenhuma forma

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
ERROR: /Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:859
ERROR:     return new TSError(diagnosticText, diagnosticCodes, diagnostics);
ERROR:            ^
ERROR: TSError: ⨯ Unable to compile TypeScript:
ERROR: src/agent.ts(760,52): error TS2345: Argument of type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to parameter of type 'ModelParams & { model: string; generationConfig: any; }'.
ERROR:   Type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to type 'ModelParams'.
ERROR:     The types of 'generationConfig.responseSchema' are incompatible between these types.
ERROR:       Type 'ResponseSchema' is not assignable to type 'Schema | undefined'.
ERROR:         Type 'ResponseSchema' is not assignable to type 'SimpleStringSchema | EnumStringSchema | NumberSchema | IntegerSchema | BooleanSchema | ArraySchema | ObjectSchema'.
ERROR:           Type 'ResponseSchema' is not assignable to type 'ObjectSchema'.
ERROR:             Types of property 'type' are incompatible.
ERROR:               Type 'SchemaType | undefined' is not assignable to type 'SchemaType.OBJECT'.
ERROR:                 Type 'undefined' is not assignable to type 'SchemaType.OBJECT'.
ERROR: src/agent.ts(1253,54): error TS2345: Argument of type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to parameter of type 'ModelParams & { model: string; generationConfig: any; }'.
ERROR:   Type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to type 'ModelParams'.
ERROR:     The types of 'generationConfig.responseSchema' are incompatible between these types.
ERROR:       Type 'ResponseSchema' is not assignable to type 'Schema | undefined'.
ERROR:         Type 'ResponseSchema' is not assignable to type 'SimpleStringSchema | EnumStringSchema | NumberSchema | IntegerSchema | BooleanSchema | ArraySchema | ObjectSchema'.
ERROR:           Type 'ResponseSchema' is not assignable to type 'ObjectSchema'.
ERROR:             Types of property 'type' are incompatible.
ERROR:               Type 'SchemaType | undefined' is not assignable to type 'SchemaType.OBJECT'.
ERROR:                 Type 'undefined' is not assignable to type 'SchemaType.OBJECT'.
ERROR: src/agent.ts(1381,52): error TS2345: Argument of type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to parameter of type 'ModelParams & { model: string; generationConfig: any; }'.
ERROR:   Type '{ model: string; generationConfig: { temperature: number; responseMimeType: string; responseSchema: ResponseSchema; }; }' is not assignable to type 'ModelParams'.
ERROR:     The types of 'generationConfig.responseSchema' are incompatible between these types.
ERROR:       Type 'ResponseSchema' is not assignable to type 'Schema | undefined'.
ERROR:         Type 'ResponseSchema' is not assignable to type 'SimpleStringSchema | EnumStringSchema | NumberSchema | IntegerSchema | BooleanSchema | ArraySchema | ObjectSchema'.
ERROR:           Type 'ResponseSchema' is not assignable to type 'ObjectSchema'.
ERROR:             Types of property 'type' are incompatible.
ERROR:               Type 'SchemaType | undefined' is not assignable to type 'SchemaType.OBJECT'.
ERROR:                 Type 'undefined' is not assignable to type 'SchemaType.OBJECT'.
ERROR:     at createTSError (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:859:12)
ERROR:     at reportTSError (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:863:19)
ERROR:     at getOutput (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:1077:36)
ERROR:     at Object.compile (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:1433:41)
ERROR:     at Module.m._compile (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:1617:30)
ERROR:     at loadTS (node:internal/modules/cjs/loader:1815:10)
ERROR:     at Object.require.extensions.<computed> [as .ts] (/Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente/node_modules/.pnpm/ts-node@10.9.2_@types+node@22.13.4_typescript@5.7.3/node_modules/ts-node/src/index.ts:1621:12)
ERROR:     at Module.load (node:internal/modules/cjs/loader:1458:32)
ERROR:     at Function._load (node:internal/modules/cjs/loader:1275:12)
ERROR:     at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
ERROR:   diagnosticCodes: [ 2345, 2345, 2345 ]
ERROR: }
```

### Resultados da Consulta

*Nenhum resultado foi registrado*

