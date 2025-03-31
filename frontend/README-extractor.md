# Extrator de Documentação do Frontend React

Este script `frontend_extractor.js` analisa uma aplicação React/TypeScript e gera um documento de referência completo no formato JSON. Ele é semelhante ao extrator Python usado para a API FastAPI, mas adaptado especificamente para código JavaScript/TypeScript e componentes React.

## Funcionamento

O script percorre todos os arquivos no diretório do frontend e analisa:

- Componentes React
- Páginas e rotas
- Hooks personalizados
- Contextos React
- Tipos e interfaces TypeScript
- Utilitários e funções auxiliares
- Chamadas de API e serviços

Para cada arquivo, ele extrai:

- Informações básicas como tamanho, caminho e tipo
- Componentes React declarados no arquivo
- Hooks utilizados e personalizados
- Importações e exportações
- Funções e métodos
- Interfaces e tipos TypeScript
- Comentários JSDoc
- Classes CSS e variáveis em arquivos de estilo

## O Arquivo JSON Gerado

O arquivo `frontend_reference.json` contém uma estrutura organizada com:

1. **Metadados do Projeto**:

   - Nome, versão, data de criação
   - Descrição

2. **Estrutura do Projeto**:

   - Hierarquia de diretórios
   - Organização de arquivos

3. **Componentes**:

   - Componentes React encontrados
   - Propriedades e padrões de uso
   - Hooks utilizados em cada componente

4. **Páginas**:

   - Componentes de página
   - Rotas associadas

5. **Hooks**:

   - Hooks personalizados
   - Implementações e uso

6. **Contextos**:

   - Contextos React
   - Padrões de gerenciamento de estado

7. **Tipos**:

   - Interfaces TypeScript
   - Tipos personalizados
   - Definições de esquema

8. **Utilitários**:

   - Funções auxiliares
   - Helpers e serviços

9. **API**:
   - Endpoints de API utilizados
   - Padrões de chamada (Axios, fetch, etc.)

## Componentes Principais Encontrados

O extrator identifica diversos tipos de componentes:

- Componentes funcionais (`const Component = () => {}`)
- Componentes de classe (`class Component extends React.Component`)
- Componentes com memo ou forwardRef (`const Component = React.memo(() => {})`)
- Componentes de página (em diretórios `/pages/`)

## Hooks Personalizados

O script identifica hooks personalizados por:

- Nome começando com "use" (convenção React)
- Declaração como função ou constante
- Localização em diretórios `/hooks/`

## Rotas e Navegação

O extrator identifica rotas através de:

- Componentes `<Route>` do React Router
- Objetos de configuração de rota
- Padrões de rota em diretórios de páginas

## Como Usar o Extrator

Para gerar a documentação, execute:

```bash
node frontend_extractor.js
```

O arquivo `frontend_reference.json` será criado no diretório raiz do frontend.
