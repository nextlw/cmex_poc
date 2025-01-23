import os
import json
import csv
import chardet
from typing import List, Dict, Any

def detect_encoding(file_path: str) -> str:
    """
    Detecta a codificação do arquivo usando chardet.
    """
    with open(file_path, 'rb') as file:
        raw_data = file.read()
        result = chardet.detect(raw_data)
        return result['encoding']

def convert_csv_to_jsonl(input_file: str, output_file: str) -> None:
    """
    Converte um arquivo CSV para JSONL.
    """
    try:
        # Detecta a codificação do arquivo
        encoding = detect_encoding(input_file)
        print(f"Codificação detectada para CSV: {encoding}")
        
        with open(input_file, 'r', encoding=encoding) as f:
            # Tenta detectar o delimitador
            sample = f.read(1024)
            f.seek(0)
            
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(sample)
            has_header = sniffer.has_header(sample)
            
            print(f"Delimitador detectado: '{dialect.delimiter}'")
            print(f"Possui cabeçalho: {has_header}")
            
            # Lê o CSV
            csv_reader = csv.reader(f, dialect)
            
            # Se tem cabeçalho, usa a primeira linha como headers
            headers = next(csv_reader) if has_header else [f"column_{i}" for i in range(len(next(csv_reader)))]
            f.seek(0)
            if not has_header:
                csv_reader = csv.reader(f, dialect)
            
            # Converte para JSONL
            with open(output_file, 'w', encoding='utf-8') as jsonl_file:
                for row in csv_reader:
                    if has_header and row == headers:
                        continue
                    
                    record = {}
                    for i, value in enumerate(row):
                        header = headers[i] if i < len(headers) else f"column_{i}"
                        # Tenta converter para número se possível
                        try:
                            if '.' in value:
                                value = float(value)
                            elif value.isdigit():
                                value = int(value)
                        except ValueError:
                            pass
                        record[header] = value
                    
                    jsonl_file.write(json.dumps(record, ensure_ascii=False) + '\n')
                    
        print(f"Arquivo CSV convertido com sucesso: {output_file}")
            
    except Exception as e:
        print(f"Erro ao processar CSV {input_file}: {str(e)}")

def convert_txt_to_jsonl(input_file: str, output_file: str) -> None:
    """
    Converte um arquivo TXT para JSONL baseado no padrão descoberto.
    """
    try:
        # Detecta a codificação do arquivo
        encoding = detect_encoding(input_file)
        print(f"Codificação detectada para TXT: {encoding}")
        
        with open(input_file, 'r', encoding=encoding) as f:
            lines = f.readlines()
            
        if not lines:
            print(f"Arquivo vazio: {input_file}")
            return
            
        # Obtém os cabeçalhos da primeira linha
        header_line = lines[0].strip()
        if '|' not in header_line:
            print(f"Formato inválido (sem separador |): {input_file}")
            return
            
        # Extrai os nomes das colunas após o primeiro |
        headers = [col.strip() for col in header_line.split('|')[1].strip().split(',')]
        
        # Processa as linhas de dados
        with open(output_file, 'w', encoding='utf-8') as f:
            for line in lines[1:]:  # Pula a primeira linha (cabeçalho)
                line = line.strip()
                if not line or '|' not in line:
                    continue
                    
                # Extrai os valores após o primeiro |
                values = [val.strip() for val in line.split('|')[1].strip().split(',')]
                
                # Cria um dicionário combinando cabeçalhos com valores
                record = {}
                for i, header in enumerate(headers):
                    if i < len(values):
                        # Remove aspas extras se existirem
                        value = values[i].strip('"\'')
                        # Converte para número se possível
                        try:
                            if '.' in value:
                                value = float(value)
                            elif value.isdigit():
                                value = int(value)
                        except ValueError:
                            pass
                        record[header] = value
                    else:
                        record[header] = None
                        
                f.write(json.dumps(record, ensure_ascii=False) + '\n')
                
        print(f"Arquivo TXT convertido com sucesso: {output_file}")
            
    except Exception as e:
        print(f"Erro ao processar TXT {input_file}: {str(e)}")

def process_directory(input_dir: str, output_dir: str) -> None:
    """
    Processa todos os arquivos TXT e CSV em um diretório e os converte para JSONL.
    """
    # Cria o diretório de saída se não existir
    os.makedirs(output_dir, exist_ok=True)
    
    # Processa cada arquivo
    for filename in os.listdir(input_dir):
        input_file = os.path.join(input_dir, filename)
        
        if filename.endswith('.txt'):
            output_file = os.path.join(output_dir, filename.replace('.txt', '.jsonl'))
            print(f"\nProcessando TXT: {filename}")
            convert_txt_to_jsonl(input_file, output_file)
            
        elif filename.endswith('.csv'):
            output_file = os.path.join(output_dir, filename.replace('.csv', '.jsonl'))
            print(f"\nProcessando CSV: {filename}")
            convert_csv_to_jsonl(input_file, output_file)

if __name__ == "__main__":
    # Diretórios de entrada e saída para arquivos de contribuições
    contrib_input_dir = "/Users/williamduarte/Documents/Empresa/Projeto/nexcode/cmex_poc/backend/data/db_contribuicaoes"
    contrib_output_dir = os.path.join(os.path.dirname(contrib_input_dir), "db_contribuicoes_jsonl")
    
    # Diretórios de entrada e saída para arquivos históricos
    hist_input_dir = "/Users/williamduarte/Documents/Empresa/Projeto/nexcode/cmex_poc/backend/data/histórico"
    hist_output_dir = os.path.join(os.path.dirname(hist_input_dir), "historico_jsonl")
    
    print("Iniciando conversão de arquivos para JSONL...")
    
    print("\nProcessando arquivos de contribuições...")
    process_directory(contrib_input_dir, contrib_output_dir)
    
    print("\nProcessando arquivos históricos...")
    process_directory(hist_input_dir, hist_output_dir)
    
    print("\nProcessamento concluído!") 