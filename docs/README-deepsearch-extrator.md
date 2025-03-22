# Extrator de Referência do DeepSearch UI Jina

Este script analisa o repositório do DeepSearch UI Jina e extrai informações relevantes sobre sua estrutura, componentes, estilos, funções JavaScript e elementos HTML, gerando um arquivo JSON que pode ser usado como referência em outros projetos.

## Objetivo

O objetivo deste extrator é criar um arquivo JSON completo que sirva como um documento de referência centralizado sobre o projeto DeepSearch UI Jina. Isso é especialmente útil quando se trabalha em integrações com outros sistemas ou quando se deseja entender a estrutura completa da interface do usuário.

## Como Usar

1. Certifique-se de ter Node.js instalado em seu sistema
2. Execute o script fornecendo o caminho para o diretório do DeepSearch UI Jina:

```bash
node deepsearch_reference_extractor.js /caminho/para/deepsearch-ui-jina
```

Se nenhum caminho for fornecido, o script tentará analisar o diretório atual:

```bash
node deepsearch_reference_extractor.js
```

## Saída

O script gera um arquivo chamado `deepsearch_ui_reference.json` com a seguinte estrutura:

```json
{
  "project": "deepsearch-ui-jina",
  "version": "1.0.0",
  "createdAt": "YYYY-MM-DD",
  "description": "Documentação completa do projeto deepsearch-ui-jina...",
  "structure": {
    "components": {
      /* Componentes JS e HTML encontrados */
    },
    "styles": {
      /* Estilos CSS encontrados */
    },
    "endpoints": {
      /* Endpoints de API encontrados */
    },
    "configs": {
      /* Arquivos de configuração */
    },
    "assets": {
      /* Recursos como imagens, SVGs, etc. */
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

- **Componentes JavaScript**: Funções, variáveis e event listeners encontrados em arquivos `.js`
- **Elementos HTML**: Tags, IDs e classes encontrados em arquivos `.html`
- **Estilos CSS**: Seletores, classes e propriedades encontrados em arquivos `.css`
- **Arquivos de Tradução**: Chaves e valores em arquivos `i18n.json`
- **Recursos Estáticos**: Imagens, ícones e outros assets

Para cada arquivo, o script extrai informações específicas baseadas no tipo:

### Para Arquivos JavaScript

- Funções e seus parâmetros
- Variáveis declaradas (const, let, var)
- Event listeners

### Para Arquivos HTML

- Contagem de tags por tipo
- Elementos com IDs específicos
- Classes utilizadas

### Para Arquivos CSS

- Contagem de seletores
- Classes definidas
- Propriedades utilizadas

## Limitações

O script atual tem algumas limitações:

1. A análise é baseada em expressões regulares, o que pode perder algumas estruturas complexas
2. Não análise JavaScript minificado de forma eficiente
3. Não identifica relações entre componentes ou dependências
4. Não analisa frameworks específicos (como React ou Vue) de maneira especializada

## Extensões Possíveis

Para uma análise mais avançada, considere as seguintes melhorias:

1. Implementar um parser AST para JavaScript para análise mais precisa
2. Adicionar suporte a frameworks de UI específicos
3. Implementar rastreamento de dependências entre componentes
4. Adicionar análise de acessibilidade para elementos HTML

## Como Usar o Arquivo de Referência

O arquivo JSON gerado pode ser usado em outros projetos de várias maneiras:

1. **Desenvolvimento de Integrações**: Entender como a UI está estruturada
2. **Documentação Automática**: Gerar documentação HTML ou Markdown a partir do arquivo JSON
3. **Análise de Dependências**: Identificar relações entre componentes
4. **Referência de Design**: Consultar estilos e elementos UI para manter consistência

## Exemplo de Uso em Novo Projeto

```javascript
const fs = require("fs");
const reference = JSON.parse(
  fs.readFileSync("deepsearch_ui_reference.json", "utf-8")
);

// Obter todos os componentes JavaScript
const jsComponents = Object.keys(reference.structure.components);
console.log("Componentes JavaScript:", jsComponents);

// Verificar estilos CSS disponíveis
const cssStyles = Object.keys(reference.structure.styles);
console.log("Estilos CSS:", cssStyles);

// Listar as funções principais do app.js
if (
  reference.structure.components["app.js"] &&
  reference.structure.components["app.js"].functions
) {
  const mainFunctions = reference.structure.components["app.js"].functions.map(
    (fn) => fn.name
  );
  console.log("Funções principais:", mainFunctions);
}
```
