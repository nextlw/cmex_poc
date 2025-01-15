import json
def convert_json_to_jsonl(input_file_path, output_file_path):
    with open(input_file_path, 'r', encoding='utf-8') as infile, \
         open(output_file_path, 'w', encoding='utf-8') as outfile:
        
        data = json.load(infile)

        # Verifica se o JSON é uma lista de objetos
        if isinstance(data, list):
            for entry in data:
                json_line = json.dumps(entry, ensure_ascii=False)
                outfile.write(json_line + '\n')
        else:
            # Se não for uma lista, escreve o objeto diretamente
            json_line = json.dumps(data, ensure_ascii=False)
            outfile.write(json_line + '\n')

if __name__ == "__main__":
    input_file = '/Users/williamduarte/Documents/Empresa/Projeto/nexcode/cmex_poc/backend/script/Tabela NCM Vigente Jan 2025.json'
    output_file = '/Users/williamduarte/Documents/Empresa/Projeto/nexcode/cmex_poc/backend/data/Tabela NCM Vigente Jan 2025.jsonl'
    convert_json_to_jsonl(input_file, output_file)