# Extrator de Referência do Buscador Inteligente

Este script analisa o repositório do Buscador Inteligente e extrai informações relevantes sobre sua estrutura, tipos, ferramentas, endpoints e outros componentes, gerando um arquivo JSON que pode ser usado como referência em outros projetos.

## Objetivo

O objetivo deste extrator é criar um arquivo JSON completo que sirva como um documento de referência centralizado sobre o projeto Buscador Inteligente. Isso é especialmente útil quando se trabalha em integrações com outros sistemas, já que todas as informações relevantes ficam organizadas em um único arquivo.

## Como Usar

1. Certifique-se de ter Node.js instalado em seu sistema
2. Execute o script fornecendo o caminho para o diretório do Buscador Inteligente:

```bash
node buscador_reference_extractor.js /caminho/para/buscador_inteligente
```

Se nenhum caminho for fornecido, o script tentará analisar o diretório atual:

```bash
node buscador_reference_extractor.js
```

## Saída

O script gera um arquivo chamado `buscador_inteligente_reference.json` com a seguinte estrutura:

```json
{
  "project": "buscador_inteligente",
  "version": "1.0.0",
  "createdAt": "YYYY-MM-DD",
  "description": "Documentação completa do projeto buscador_inteligente...",
  "structure": {
    "types": {
      /* Tipos encontrados */
    },
    "tools": {
      /* Ferramentas encontradas */
    },
    "services": {
      /* Serviços encontrados */
    },
    "endpoints": {
      /* Endpoints de API encontrados */
    },
    "configs": {
      /* Arquivos de configuração */
    }
  },
  "fileStructure": {
    /* Estrutura de diretórios */
  },
  "files": [
    /* Lista detalhada de todos os arquivos analisados */
  ]
}
```

## Informações Extraídas

O script extrai as seguintes informações:

- **Tipos e Interfaces**: Encontrados em arquivos `.ts`, especialmente em `src/types/`
- **Ferramentas**: Encontradas em `src/tools/`
- **Serviços**: Encontrados em `src/services/`
- **Endpoints**: Analisando rotas em `src/routes/` e `src/server.ts`
- **Configurações**: Arquivos em `src/config/` e arquivos com nomes contendo "config"
- **Exportações**: Funções, classes, interfaces e outros itens exportados
- **Importações**: Dependências importadas em cada arquivo
- **Funções**: Funções declaradas em arquivos JavaScript/TypeScript
- **Documentação**: Conteúdo de arquivos Markdown

## Limitações

O script atual tem algumas limitações:

1. A análise de TypeScript é simplificada e baseada em expressões regulares, não utilizando o TypeScript Compiler API
2. A extração de endpoints é básica e pode não capturar rotas definidas de maneiras não convencionais
3. Não analisa conteúdo de arquivos binários ou formatos não suportados

## Extensões Possíveis

Para uma análise mais avançada, considere as seguintes melhorias:

1. Usar o TypeScript Compiler API para uma análise precisa de tipos
2. Implementar análise de arquivos Swagger/OpenAPI para documentação de API completa
3. Adicionar extração de esquemas de banco de dados e modelos
4. Incluir análise de dependências e árvore de chamadas entre componentes

## Como Usar o Arquivo de Referência

O arquivo JSON gerado pode ser usado em outros projetos de várias maneiras:

1. **Integração com Ferramentas**: Carregue-o em ferramentas de integração para conhecer os endpoints e tipos disponíveis
2. **Documentação Automática**: Gere documentação HTML ou Markdown a partir do arquivo JSON
3. **Referência de Desenvolvimento**: Consulte-o para entender a estrutura do projeto
4. **Geração de Código**: Use-o para gerar código cliente ou adaptadores

## Exemplo de Uso em Novo Projeto

```javascript
const fs = require("fs");
const reference = JSON.parse(
  fs.readFileSync("buscador_inteligente_reference.json", "utf-8")
);

// Obter todos os endpoints disponíveis
const endpoints = Object.keys(reference.structure.endpoints);
console.log("Endpoints disponíveis:", endpoints);

// Verificar tipos disponíveis
const types = Object.keys(reference.structure.types);
console.log("Tipos disponíveis:", types);

// Verificar ferramentas disponíveis
const tools = Object.keys(reference.structure.tools);
console.log("Ferramentas disponíveis:", tools);
```
