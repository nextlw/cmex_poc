# Formato Otimizado para LLMs

Este diretório contém arquivos no formato JSONL (JSON Lines) otimizados para consumo por Large Language Models (LLMs). O objetivo é fornecer uma estrutura de dados eficiente que permita às LLMs entender rapidamente a arquitetura, componentes e documentação do projeto CMEX.

## Estrutura de Arquivos

- `llm_format.jsonl`: Arquivo principal contendo todas as informações do projeto em formato JSONL.
- `llm_chunks/`: Diretório contendo os chunks dos documentos maiores.
  - `index.json`: Índice dos chunks disponíveis.
  - `{documento_id}_chunks.jsonl`: Arquivos JSONL com chunks de documentos grandes.

## Formato JSONL

O arquivo `llm_format.jsonl` contém uma linha JSON por recurso, cada uma com seu tipo e dados específicos:

1. **Metadados do Projeto** (linha 1):

   ```json
   {"type": "project_metadata", "data": {...}}
   ```

2. **Arquitetura** (linha 2):

   ```json
   {"type": "architecture", "data": {...}}
   ```

3. **Instruções para LLMs** (linha 3):

   ```json
   {"type": "llm_instructions", "data": [...]}
   ```

4. **Regras de Desenvolvimento** (linha 4):

   ```json
   {"type": "development_rules", "data": [...]}
   ```

5. **Documentos** (linhas subsequentes):

   ```json
   {"type": "document", "data": {...}}
   ```

   ou

   ```json
   {"type": "document_reference", "data": {...}}
   ```

6. **Referências JSON**:

   ```json
   {"type": "json_reference", "data": {...}}
   ```

7. **Extratores**:

   ```json
   {"type": "extractor", "data": {...}}
   ```

## Sistema de Chunking

Para documentos grandes, implementamos um sistema de chunking para dividir o conteúdo em pedaços menores (de até 2000 caracteres cada). Isso facilita o processamento por LLMs, que geralmente têm limitações de contexto.

- Documentos pequenos: Incluídos diretamente no arquivo principal.
- Documentos grandes: Armazenados como chunks separados em `llm_chunks/{documento_id}_chunks.jsonl`.

## Regras de Desenvolvimento

O formato inclui regras de desenvolvimento que as LLMs devem respeitar ao gerar código ou sugerir mudanças. Estas regras incluem:

1. **Regras do Projeto**: Extraídas diretamente do arquivo `rulles.txt`, que contém as diretrizes oficiais de implementação.

2. **Regras para Prevenção de Problemas Comuns**:
   - Prevenção de arquivos duplicados
   - Prevenção de arquivos desnecessários
   - Prevenção de arquivos fora do escopo
   - Prevenção de tipos inválidos ou redundantes
   - Prevenção de implementações conflitantes
   - Manutenção da estrutura do projeto
   - Respeito às convenções de nomenclatura
   - Reutilização de código existente
   - Respeito às fronteiras entre componentes

As LLMs devem seguir estritamente essas regras ao propor alterações ou gerar código para o projeto.

## Geração do Formato

O arquivo é gerado pelo script `generate_llm_format.py`, que:

1. Lê o arquivo `llm_project_summary.md`.
2. Extrai seções relevantes (metadados, documentação, componentes, etc.).
3. Extrai regras do arquivo `rulles.txt` e adiciona regras complementares.
4. Divide documentos grandes em chunks.
5. Gera o arquivo JSONL final e os chunks.

## Uso por LLMs

As LLMs devem processar o arquivo `llm_format.jsonl` sequencialmente para:

1. Primeiro, entender os metadados do projeto e sua arquitetura geral.
2. Ler as instruções específicas para LLMs.
3. Internalizar as regras de desenvolvimento para evitar problemas comuns.
4. Processar os documentos relevantes para uma tarefa específica.
5. Usar as referências JSON quando necessário para informações detalhadas de implementação.

Para documentos divididos em chunks, a LLM deve seguir a referência ao arquivo de chunks e processá-los em ordem.

## Metadados Adicionais

Além das informações básicas, o formato inclui:

- Timestamp de atualização
- Informações sobre tamanho de arquivos JSON
- IDs de chunks para referência cruzada
- Contagem total de chunks para documentos grandes

Este formato foi projetado para maximizar a eficiência da absorção e compreensão de informações por LLMs, enquanto garante que o código gerado siga as regras e diretrizes do projeto.
