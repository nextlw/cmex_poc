import os
import json
import numpy as np
from typing import List, Dict, Any
import google.generativeai as genai
from tqdm import tqdm
import time
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Configuração do Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

def get_embedding(text: str) -> List[float]:
    """
    Obtém o embedding de um texto usando o modelo de embeddings do Google.
    Inclui retry em caso de erro e rate limiting.
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            embedding = genai.embed_content(
                model='models/embedding-001',
                content=text,
                task_type="retrieval_document"
            )
            return embedding['embedding']
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"Erro ao gerar embedding: {str(e)}")
                return None
            time.sleep(2 ** attempt)  # Exponential backoff

def process_jsonl_file(input_file: str, output_file: str) -> None:
    """
    Processa um arquivo JSONL e cria embeddings para cada registro.
    """
    try:
        records = []
        with open(input_file, 'r', encoding='utf-8') as f:
            for line in f:
                records.append(json.loads(line.strip()))
        
        print(f"\nProcessando {len(records)} registros de {input_file}")
        
        vectorized_records = []
        for record in tqdm(records, desc="Gerando embeddings"):
            # Concatena todos os valores do registro em um texto
            text_content = " ".join(str(value) for value in record.values())
            
            # Gera o embedding
            embedding = get_embedding(text_content)
            if embedding is not None:
                vectorized_record = {
                    "original": record,
                    "embedding": embedding
                }
                vectorized_records.append(vectorized_record)
        
        # Salva os registros vetorizados
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                "metadata": {
                    "source_file": os.path.basename(input_file),
                    "total_records": len(vectorized_records),
                    "embedding_model": "google-embedding-001",
                    "embedding_dimension": len(vectorized_records[0]["embedding"]) if vectorized_records else 0
                },
                "records": vectorized_records
            }, f, ensure_ascii=False, indent=2)
            
        print(f"Arquivo processado com sucesso: {output_file}")
        print(f"Total de registros vetorizados: {len(vectorized_records)}")
            
    except Exception as e:
        print(f"Erro ao processar {input_file}: {str(e)}")

def process_directory(input_dir: str, output_dir: str) -> None:
    """
    Processa todos os arquivos JSONL em um diretório e cria suas versões vetorizadas.
    """
    # Cria o diretório de saída se não existir
    os.makedirs(output_dir, exist_ok=True)
    
    # Processa cada arquivo JSONL
    for filename in os.listdir(input_dir):
        if filename.endswith('.jsonl'):
            input_file = os.path.join(input_dir, filename)
            output_file = os.path.join(output_dir, filename.replace('.jsonl', '_vectors.json'))
            
            print(f"\nProcessando: {filename}")
            process_jsonl_file(input_file, output_file)

if __name__ == "__main__":
    # Diretórios de entrada e saída
    input_dir = "/Users/williamduarte/Documents/Empresa/Projeto/nexcode/cmex_poc/backend/data/db_ncm_vector"  # Apenas o diretório
    output_dir = os.path.join(os.path.dirname(input_dir), "db_ncm_vector")  # Diretório para os vetores
    
    print("Iniciando vetorização dos arquivos JSONL...")
    process_directory(input_dir, output_dir)
    print("\nProcessamento concluído!") 