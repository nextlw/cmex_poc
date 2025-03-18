import os
import json
from glob import glob
from sentence_transformers import SentenceTransformer
import numpy as np

def read_json_file(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                return data
            except Exception as e:
                print(f"Erro ao ler {filepath}: {e}")
                return []
    return []

def consolidate_jsons(directory):
    """
    Lê os arquivos JSON (context.json, queries.json, questions.json e knowledge.json)
    a partir do diretório especificado e consolida seus dados em uma lista de documentos.
    Cada documento possui o texto concatenado dos valores (se for dicionário)
    ou o próprio texto se for uma string.
    """
    docs = []
    filenames = ['context.json', 'queries.json', 'questions.json', 'knowledge.json']
    for filename in filenames:
        filepath = os.path.join(directory, filename)
        data = read_json_file(filepath)
        if not data:
            continue
        for item in data:
            if isinstance(item, dict):
                text = " ".join(str(value) for value in item.values() if isinstance(value, str))
            elif isinstance(item, list):
                text = " ".join(item)
            else:
                text = str(item)
            docs.append({
                "source": filename,
                "text": text
            })
    return docs

def consolidate_prompts(directory):
    """
    Lê todos os arquivos de texto com padrão 'prompt-*.txt' 
    a partir do diretório especificado e os consolida em uma lista de documentos.
    """
    docs = []
    pattern = os.path.join(directory, "prompt-*.txt")
    for filepath in glob(pattern):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read().strip()
            if content:
                docs.append({
                    "source": os.path.basename(filepath),
                    "text": content
                })
        except Exception as e:
            print(f"Erro ao ler {filepath}: {e}")
    return docs

def consolidate_documents(directory):
    """
    Consolida documentos a partir de arquivos JSON e arquivos de texto (prompt-*.txt)
    do diretório especificado.
    """
    docs = consolidate_jsons(directory)
    docs.extend(consolidate_prompts(directory))
    return docs

def compute_embeddings(doc_texts, model):
    """
    Recebe uma lista de textos de documentos e calcula seus vetores de embedding.
    """
    vectors = model.encode(doc_texts, convert_to_numpy=True)
    return vectors

def main():
    # Define a pasta onde os arquivos JSON e prompts estão armazenados e onde serão salvos os vetores consolidados
    prompt_folder = 'prompt'
    if not os.path.exists(prompt_folder):
        os.makedirs(prompt_folder)

    # Consolida os dados dos arquivos JSON e dos arquivos de prompt
    docs = consolidate_documents(prompt_folder)
    if not docs:
        print("Nenhum dado encontrado para consolidar.")
        return

    texts = [doc['text'] for doc in docs]
    sources = [doc['source'] for doc in docs]

    # Carrega o modelo de embedding
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = compute_embeddings(texts, model)

    # Salva os vetores em um arquivo .npy
    embeddings_filepath = os.path.join(prompt_folder, 'consolidated_vectors.npy')
    np.save(embeddings_filepath, embeddings)

    # Salva os metadados dos documentos consolidados (fonte e texto) em formato JSON
    meta_data = [{"source": src, "text": t} for src, t in zip(sources, texts)]
    meta_filepath = os.path.join(prompt_folder, 'consolidated_metadata.json')
    with open(meta_filepath, 'w', encoding='utf-8') as f:
        json.dump(meta_data, f, ensure_ascii=False, indent=2)

    print(f"Vetores salvos em {embeddings_filepath} e metadados salvos em {meta_filepath}.")

if __name__ == '__main__':
    main()