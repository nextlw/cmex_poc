# Documentação do Projeto CMEX

## Visão Geral

Esta pasta contém toda a documentação do projeto CMEX, organizada em uma estrutura de diretórios para facilitar a navegação e manutenção. Além da documentação em si, também inclui scripts para organização e geração de formatos otimizados para LLMs (Large Language Models).

## Estrutura de Diretórios

Após executar o script `organize_docs.sh`, a documentação estará organizada da seguinte forma:

```
docs/
├── README.md                  # Sumário principal (cópia de llm_project_summary.md)
├── llm_project_summary.md     # Sumário estruturado para LLMs
├── llm_format.jsonl           # Formato JSONL otimizado para LLMs
├── organize_docs.sh           # Script para organizar documentos em pastas
├── generate_llm_format.py     # Script para gerar formato JSONL para LLMs
├── arquitetura/               # Documentos de arquitetura
├── guias/                     # Guias e manuais do usuário
├── tecnico/                   # Documentação técnica
├── analises/                  # Análises comparativas
├── implementacao/             # Documentos de implementação
├── extratores/                # Scripts extratores
└── json/                      # Arquivos JSON gerados pelos extratores
```

## Scripts Disponíveis

### 1. organize_docs.sh

Este script organiza os documentos em uma estrutura de pastas lógica e cria índices em cada pasta.

**Como usar:**

```bash
cd docs
chmod +x organize_docs.sh
./organize_docs.sh
```

**O que ele faz:**

- Cria a estrutura de diretórios
- Move os arquivos para as pastas apropriadas
- Cria índices README.md em cada pasta
- Copia o sumário principal para README.md

### 2. generate_llm_format.py

Este script transforma o sumário do projeto (`llm_project_summary.md`) em um formato JSONL otimizado para uso por LLMs, facilitando o processamento automatizado.

**Requisitos:**

```bash
pip install markdown beautifulsoup4
```

**Como usar:**

```bash
cd docs
python generate_llm_format.py
```

**O que ele gera:**

- Um arquivo `llm_format.jsonl` contendo:
  - Metadados do projeto
  - Arquitetura
  - Documentos (um por linha)
  - Referências JSON
  - Extratores

## Extratores de Documentação

Os extratores são scripts que analisam o código-fonte do projeto e geram arquivos JSON com informações estruturadas:

- **fastapi_extractor.py** - Analisa a API FastAPI
- **frontend_extractor.js** - Analisa o frontend React
- **node_deepresearch_extractor.js** - Analisa o componente DeepResearch
- **buscador_reference_extractor.js** - Analisa o buscador inteligente

Para mais informações sobre os extratores, consulte [extratores/README-extractor.md](extratores/README-extractor.md).

## Manutenção da Documentação

### Atualizando o Sumário

Ao adicionar ou modificar documentos:

1. Atualize o arquivo `llm_project_summary.md` com as novas informações
2. Execute o script `generate_llm_format.py` para atualizar o formato JSONL
3. Execute o script `organize_docs.sh` para reorganizar os documentos

### Atualizando os JSONs de Referência

Para atualizar os arquivos JSON de referência:

1. Execute os extratores conforme documentado em [extratores/README-extractor.md](extratores/README-extractor.md)
2. Os arquivos JSON gerados serão salvos na pasta raiz (ou nas pastas especificadas)
3. Execute `organize_docs.sh` para movê-los para a pasta json/

## Uso por LLMs

O formato JSONL gerado (`llm_format.jsonl`) é especialmente projetado para facilitar o uso por modelos de linguagem:

1. Cada linha é um objeto JSON independente
2. Cada objeto tem um campo `type` que indica seu tipo
3. Os dados estão estruturados de forma consistente
4. Referências cruzadas são mantidas via IDs

Isso permite que LLMs processem a documentação de forma mais eficiente e precisa.

## Contribuição

Ao contribuir com a documentação:

1. Mantenha a consistência de formato e estilo
2. Atualize o sumário quando adicionar novos documentos
3. Execute os scripts de organização após alterações significativas
4. Verifique links e referências cruzadas
