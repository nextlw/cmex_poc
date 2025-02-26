import os
import json
from typing import List, Dict, Any
from datetime import datetime

def convert_json_to_jsonl(input_file: str, output_file: str) -> None:
    """
    Converte um arquivo JSON para JSONL, especificamente para a estrutura da Tabela NCM.
    """
    try:
        # Lê o arquivo JSON
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        print(f"\nProcessando arquivo: {input_file}")
        print(f"Data da última atualização: {data.get('Data_Ultima_Atualizacao_NCM')}")
        print(f"Ato: {data.get('Ato')}")
        
        # Extrai as nomenclaturas
        nomenclaturas = data.get('Nomenclaturas', [])
        total_nomenclaturas = len(nomenclaturas)
        print(f"Total de nomenclaturas encontradas: {total_nomenclaturas}")
        
        # Converte para JSONL
        with open(output_file, 'w', encoding='utf-8') as f:
            # Adiciona metadados como primeiro registro
            metadata = {
                "tipo": "metadata",
                "data_atualizacao": data.get('Data_Ultima_Atualizacao_NCM'),
                "ato": data.get('Ato'),
                "total_registros": total_nomenclaturas,
                "data_processamento": datetime.now().isoformat()
            }
            f.write(json.dumps(metadata, ensure_ascii=False) + '\n')
            
            # Processa cada nomenclatura
            for item in nomenclaturas:
                # Cria um registro enriquecido
                record = {
                    "tipo": "nomenclatura",
                    "codigo": item.get('Codigo', ''),
                    "descricao": item.get('Descricao', ''),
                    "data_inicio": item.get('Data_Inicio', ''),
                    "data_fim": item.get('Data_Fim', ''),
                    "tipo_ato": item.get('Tipo_Ato', ''),
                    "numero_ato": item.get('Numero_Ato', ''),
                    "ano_ato": item.get('Ano_Ato', '')
                }
                
                # Adiciona campos opcionais se existirem
                if 'Nivel' in item:
                    record['nivel'] = item['Nivel']
                if 'Codigo_Pai' in item:
                    record['codigo_pai'] = item['Codigo_Pai']
                if 'Nomenclatura_Pai' in item:
                    record['nomenclatura_pai'] = item['Nomenclatura_Pai']
                
                f.write(json.dumps(record, ensure_ascii=False) + '\n')
                
        print(f"Arquivo convertido com sucesso: {output_file}")
        print(f"Total de registros processados: {total_nomenclaturas + 1}")  # +1 para o metadata
            
    except Exception as e:
        print(f"Erro ao processar {input_file}: {str(e)}")

def process_directory(input_dir: str, output_dir: str) -> None:
    """
    Processa todos os arquivos JSON em um diretório e os converte para JSONL.
    """
    # Cria o diretório de saída se não existir
    os.makedirs(output_dir, exist_ok=True)
    
    # Processa cada arquivo JSON
    for filename in os.listdir(input_dir):
        if filename.endswith('.json'):
            input_file = os.path.join(input_dir, filename)
            output_file = os.path.join(output_dir, filename.replace('.json', '.jsonl'))
            
            print(f"\nProcessando: {filename}")
            convert_json_to_jsonl(input_file, output_file)

if __name__ == "__main__":
    # Diretórios de entrada e saída
    input_dir = "/Users/williamduarte/Documents/Empresa/Projeto/nexcode/cmex_poc/backend/script"
    output_dir = "/Users/williamduarte/Documents/Empresa/Projeto/nexcode/cmex_poc/backend/data/db_ncm_vector"
    
    print("Iniciando conversão de arquivos JSON para JSONL...")
    process_directory(input_dir, output_dir)
    print("\nProcessamento concluído!") 