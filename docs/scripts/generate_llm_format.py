#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para converter o sumário do projeto em um formato otimizado para LLMs.
Gera um arquivo JSONL com cada documento e suas informações estruturadas.
"""

import os
import json
import re
import markdown
from bs4 import BeautifulSoup
import hashlib
from datetime import datetime

# Configurações
SOURCE_FILE = "docs/llm_project_summary.md"
OUTPUT_FILE = "docs/llm_format.jsonl"
CHUNKED_OUTPUT_DIR = "docs/llm_chunks"
RULES_FILE = "buscador_inteligente/src/regras/rulles.txt"


def extract_section(content, section_name):
    """Extrai uma seção específica do documento markdown."""
    pattern = rf"## {section_name}\s+(.+?)(?=\s*##|\Z)"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""


def extract_json_block(text):
    """Extrai blocos JSON do texto markdown."""
    pattern = r"```json\s+([\s\S]+?)\s+```"
    matches = re.findall(pattern, text, re.DOTALL)
    if matches:
        return matches
    return []


def extract_code_blocks(text):
    """Extrai blocos de código do texto markdown."""
    pattern = r"```(?:\w+)?\s+([\s\S]+?)\s+```"
    matches = re.findall(pattern, text, re.DOTALL)
    return matches


def extract_table_data(text):
    """Converte tabelas markdown em estruturas de dados Python."""
    html = markdown.markdown(text, extensions=["tables"])
    soup = BeautifulSoup(html, "html.parser")
    tables = []

    for table in soup.find_all("table"):
        headers = [th.text.strip() for th in table.find_all("th")]

        rows = []
        for tr in table.find_all("tr")[1:]:  # Pula a linha de cabeçalho
            row = {}
            for i, td in enumerate(tr.find_all("td")):
                if i < len(headers):
                    row[headers[i]] = td.text.strip()
            rows.append(row)

        tables.append({"headers": headers, "rows": rows})

    return tables


def extract_components(text):
    """Extrai descrições de componentes do documento."""
    components = {}
    pattern = r"### ([^\n]+)\s*- ([^\n]+)"
    matches = re.findall(pattern, text, re.MULTILINE)
    for name, description in matches:
        components[name.strip()] = description.strip()
    return components


def extract_document_descriptions(text):
    """Extrai descrições de documentos."""
    descriptions = {}
    pattern = r'<a id="([^"]+)"></a>\s*### ([^\n]+)\s*([^\n]+)'
    matches = re.findall(pattern, text, re.DOTALL)

    for match in matches:
        id = match[0].strip()
        name = match[1].strip()
        description = match[2].strip()

        # Procura por mais conteúdo para essa entrada
        extended_pattern = (
            rf'<a id="{id}"></a>\s*### {re.escape(name)}\s*(.+?)(?=<a id="|$)'
        )
        extended_match = re.search(extended_pattern, text, re.DOTALL)
        if extended_match:
            description = extended_match.group(1).strip()

        descriptions[id] = {"name": name, "description": description}

    return descriptions


def extract_instruction_sections(text):
    """Extrai seções de instruções específicas para LLMs."""
    instructions_section = extract_section(text, "Instruções para Uso por LLMs")
    instructions = []

    if instructions_section:
        lines = instructions_section.split("\n")
        for line in lines:
            if line.strip() and line.strip()[0].isdigit():
                # Assume que cada instrução começa com um número
                parts = line.split(":", 1)
                if len(parts) > 1:
                    label = (
                        parts[0].strip().split(".")[1].strip()
                        if "." in parts[0]
                        else parts[0].strip()
                    )
                    content = parts[1].strip()
                    instructions.append({"label": label, "content": content})

    return instructions


def extract_rules_from_file():
    """Extrai regras do arquivo rulles.txt e adiciona regras adicionais."""
    rules = []

    # Tenta ler o arquivo de regras
    if os.path.exists(RULES_FILE):
        with open(RULES_FILE, "r", encoding="utf-8") as f:
            content = f.read()

            # Extrai regras numeradas
            pattern = r"(\d+)\.\s+(.+?)(?=\n\d+\.|\Z)"
            matches = re.findall(pattern, content, re.DOTALL)
            for num, rule in matches:
                rules.append(
                    {
                        "id": f"rule_{num}",
                        "source": "rulles.txt",
                        "content": rule.strip(),
                    }
                )

    # Adiciona regras adicionais sobre criação de arquivos e tipos
    additional_rules = [
        {
            "id": "prevent_duplicate_files",
            "source": "llm_guidelines",
            "content": "Nunca crie arquivos duplicados. Sempre verifique se um arquivo já existe antes de criar um novo.",
        },
        {
            "id": "prevent_unnecessary_files",
            "source": "llm_guidelines",
            "content": "Não crie arquivos desnecessários. Cada arquivo deve ter um propósito claro e justificável dentro do projeto.",
        },
        {
            "id": "prevent_out_of_scope",
            "source": "llm_guidelines",
            "content": "Não crie arquivos fora do escopo do projeto. Siga estritamente a estrutura de diretórios e componentes existentes.",
        },
        {
            "id": "prevent_invalid_types",
            "source": "llm_guidelines",
            "content": "Não crie tipos que não façam sentido no contexto do projeto. Todos os tipos devem seguir as convenções estabelecidas.",
        },
        {
            "id": "prevent_duplicate_types",
            "source": "llm_guidelines",
            "content": "Não crie tipos duplicados ou redundantes. Verifique se um tipo já existe antes de criar um novo.",
        },
        {
            "id": "prevent_conflicting_implementations",
            "source": "llm_guidelines",
            "content": "Evite implementações que causem conflitos com código existente. Mantenha a coerência com o estilo e abordagem atuais.",
        },
        {
            "id": "maintain_project_structure",
            "source": "llm_guidelines",
            "content": "Mantenha a estrutura do projeto. Não altere a organização de diretórios ou arquivos existentes sem uma razão muito clara.",
        },
        {
            "id": "follow_naming_conventions",
            "source": "llm_guidelines",
            "content": "Siga as convenções de nomenclatura existentes para arquivos, variáveis, funções e classes.",
        },
        {
            "id": "reuse_existing_code",
            "source": "llm_guidelines",
            "content": "Reutilize código existente quando apropriado. Não reinvente funcionalidade que já existe no projeto.",
        },
        {
            "id": "respect_component_boundaries",
            "source": "llm_guidelines",
            "content": "Respeite as fronteiras entre componentes. Adicione código apenas nos componentes corretos conforme a arquitetura do projeto.",
        },
    ]

    # Adiciona as regras adicionais à lista
    rules.extend(additional_rules)

    return rules


def generate_document_embeddings_info():
    """Gera informações sobre embeddings de documentos."""
    embedding_info = []

    # Procura os arquivos JSON de referência conforme listado na documentação
    json_files = [
        "fastapi_reference.json",
        "frontend_reference.json",
        "node_deepresearch_reference.json",
        "buscador_inteligente_reference.json",
        "deepsearch_ui_reference.json",
    ]

    for file in json_files:
        path = os.path.join("docs", file)
        if os.path.exists(path):
            file_size = os.path.getsize(path)
            embedding_info.append(
                {
                    "file": file,
                    "exists": True,
                    "size_bytes": file_size,
                    "size_human": (
                        f"{file_size / 1024:.1f}KB"
                        if file_size < 1024 * 1024
                        else f"{file_size / (1024*1024):.1f}MB"
                    ),
                }
            )
        else:
            embedding_info.append({"file": file, "exists": False})

    return embedding_info


def chunk_document(document, chunk_size=2000):
    """Divide um documento em pedaços menores para processamento por LLMs."""
    content = document.get("description", "")
    if len(content) <= chunk_size:
        return [document]

    # Divide por parágrafos
    paragraphs = re.split(r"\n\n+", content)
    chunks = []
    current_chunk = ""

    for para in paragraphs:
        if len(current_chunk) + len(para) <= chunk_size:
            current_chunk += para + "\n\n"
        else:
            # Adiciona o chunk atual à lista e começa um novo
            doc_copy = document.copy()
            doc_copy["description"] = current_chunk.strip()
            doc_copy["chunk_id"] = hashlib.md5(current_chunk.encode()).hexdigest()[:8]
            chunks.append(doc_copy)
            current_chunk = para + "\n\n"

    # Adiciona o último chunk se houver conteúdo
    if current_chunk.strip():
        doc_copy = document.copy()
        doc_copy["description"] = current_chunk.strip()
        doc_copy["chunk_id"] = hashlib.md5(current_chunk.encode()).hexdigest()[:8]
        chunks.append(doc_copy)

    return chunks


def create_llm_format():
    """Cria o formato otimizado para LLMs."""
    if not os.path.exists(SOURCE_FILE):
        print(f"Arquivo de origem {SOURCE_FILE} não encontrado.")
        return

    with open(SOURCE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Extrai metadados
    metadata_section = extract_section(content, "Metadados do Projeto")
    json_blocks = extract_json_block(metadata_section)
    metadata = json.loads(json_blocks[0]) if json_blocks else {}

    # Extrai tabelas
    tables_section = extract_section(content, "Índice de Documentação")
    tables = extract_table_data(tables_section)
    documents_table = tables[0] if tables else {"rows": []}

    # Extrai tabelas de referência JSON
    reference_section = extract_section(
        content, "Documentos de Referência JSON \(Gerados\)"
    )
    reference_tables = extract_table_data(reference_section)
    reference_json = reference_tables[0] if reference_tables else {"rows": []}

    # Extrai extratores
    extratores_section = extract_section(content, "Extratores de Código")
    extratores_json = extract_json_block(extratores_section)
    extratores = json.loads(extratores_json[0]) if extratores_json else {}

    # Extrai descrições de documentos
    doc_descriptions = extract_document_descriptions(content)

    # Extrai componentes
    components_section = extract_section(content, "Componentes Principais")
    components = extract_components(components_section)

    # Extrai relações
    relations_section = extract_section(content, "Relações entre Componentes")
    relations_code = extract_code_blocks(relations_section)
    relations = relations_code[0] if relations_code else ""

    # Extrai padrões técnicos
    patterns_section = extract_section(content, "Padrões Técnicos Relevantes")

    # Extrai instruções para LLMs
    llm_instructions = extract_instruction_sections(content)

    # Informações sobre embeddings
    embedding_info = generate_document_embeddings_info()

    # Extrai regras de desenvolvimento
    rules = extract_rules_from_file()

    # Cria listas e dicionários finais
    documents = []
    for row in documents_table.get("rows", []):
        doc_id = (
            row.get("Documento", "").split("#")[1].strip(")")
            if "#" in row.get("Documento", "")
            else ""
        )
        doc_info = doc_descriptions.get(doc_id, {})

        documents.append(
            {
                "id": doc_id,
                "filename": row.get("Documento", "").split("]")[0].strip("["),
                "type": row.get("Tipo", ""),
                "purpose": row.get("Propósito", ""),
                "structure": row.get("Estrutura", ""),
                "updated": row.get("Atualizado", "") == "✅",
                "name": doc_info.get("name", ""),
                "description": doc_info.get("description", ""),
            }
        )

    # Cria o dicionário final
    project_data = {
        "project": {
            "name": metadata.get("project_name", ""),
            "version": metadata.get("version", ""),
            "components": metadata.get("components", []),
            "integrations": metadata.get("integrations", []),
            "last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        },
        "documentation": {
            "documents": documents,
            "json_references": reference_json.get("rows", []),
            "extractors": extratores.get("extratores", []),
            "embedding_info": embedding_info,
        },
        "architecture": {
            "components": components,
            "relations": relations,
            "patterns": patterns_section,
        },
        "llm_instructions": llm_instructions,
        "development_rules": rules,
    }

    # Cria diretório para chunks se não existir
    if not os.path.exists(CHUNKED_OUTPUT_DIR):
        os.makedirs(CHUNKED_OUTPUT_DIR)

    # Converte para JSONL
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        # Linha 1: Metadados do projeto
        f.write(
            json.dumps({"type": "project_metadata", "data": project_data["project"]})
            + "\n"
        )

        # Linha 2: Arquitetura
        f.write(
            json.dumps({"type": "architecture", "data": project_data["architecture"]})
            + "\n"
        )

        # Linha 3: Instruções para LLMs
        f.write(
            json.dumps(
                {"type": "llm_instructions", "data": project_data["llm_instructions"]}
            )
            + "\n"
        )

        # Linha 4: Regras de desenvolvimento
        f.write(
            json.dumps(
                {"type": "development_rules", "data": project_data["development_rules"]}
            )
            + "\n"
        )

        # Linha 5 em diante: Documentos (um por linha)
        for doc in documents:
            # Cria chunks para documentos grandes
            doc_chunks = chunk_document(doc)

            # Se o documento foi dividido, salva os chunks em arquivos separados
            if len(doc_chunks) > 1:
                chunk_file = os.path.join(
                    CHUNKED_OUTPUT_DIR, f"{doc['id']}_chunks.jsonl"
                )
                with open(chunk_file, "w", encoding="utf-8") as chunk_f:
                    for idx, chunk in enumerate(doc_chunks):
                        chunk["chunk_index"] = idx
                        chunk["total_chunks"] = len(doc_chunks)
                        chunk_f.write(
                            json.dumps({"type": "document_chunk", "data": chunk}) + "\n"
                        )

                # No arquivo principal, apenas inclui a referência ao arquivo de chunks
                doc_ref = {
                    "id": doc["id"],
                    "filename": doc["filename"],
                    "type": doc["type"],
                    "purpose": doc["purpose"],
                    "chunked": True,
                    "chunks_file": f"{doc['id']}_chunks.jsonl",
                    "total_chunks": len(doc_chunks),
                }
                f.write(
                    json.dumps({"type": "document_reference", "data": doc_ref}) + "\n"
                )
            else:
                # Se não foi dividido, inclui o documento completo
                f.write(json.dumps({"type": "document", "data": doc}) + "\n")

        # Referências JSON
        for ref in reference_json.get("rows", []):
            f.write(json.dumps({"type": "json_reference", "data": ref}) + "\n")

        # Extratores
        for ext in extratores.get("extratores", []):
            f.write(json.dumps({"type": "extractor", "data": ext}) + "\n")

    print(f"Arquivo JSONL gerado com sucesso: {OUTPUT_FILE}")
    print(f"Total de {len(documents)} documentos processados")
    print(f"Total de {len(rules)} regras de desenvolvimento incluídas")

    # Cria um arquivo de índice para os chunks
    index_file = os.path.join(CHUNKED_OUTPUT_DIR, "index.json")
    with open(index_file, "w", encoding="utf-8") as f:
        index = {
            "creation_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source_file": SOURCE_FILE,
            "chunk_files": [
                f"{doc['id']}_chunks.jsonl"
                for doc in documents
                if len(chunk_document(doc)) > 1
            ],
            "documents": [
                {
                    "id": doc["id"],
                    "filename": doc["filename"],
                    "chunks": len(chunk_document(doc)),
                }
                for doc in documents
            ],
        }
        json.dump(index, f, indent=2)

    print(f"Índice de chunks gerado: {index_file}")


if __name__ == "__main__":
    create_llm_format()
