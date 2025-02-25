import os
import json
from datetime import datetime
import subprocess

# Caminhos dos arquivos
CONS_METADATA_PATH = os.path.join("prompt", "consolidated_metadata.json")
RESUMO_CONSULTAS_PATH = os.path.join("prompt", "resumo_consultas.txt")

def load_consolidated_metadata():
    """
    Carrega o conteúdo consolidado dos arquivos de prompt.
    Retorna uma lista de dicionários representando a cadeia de queries.
    """
    if os.path.exists(CONS_METADATA_PATH):
        try:
            with open(CONS_METADATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
        except Exception as e:
            print(f"Erro ao ler {CONS_METADATA_PATH}: {e}")
            return []
    return []

def finalize_consulta(question, final_answer):
    """
    Função para ser chamada no final do processo de consulta.
    Ao ser executada, a função:
      - Solicita ao usuário que avalie a resposta final de 0 a 5,
        onde 0 significa que o resultado desviou completamente,
        3 significa que foi no caminho certo, mas a resposta não foi exata,
        e 5 significa que foi perfeitamente pesquisado e respondido.
      - Lê o arquivo consolidado (criado pelo educ.py) e organiza a cadeia de queries,
        separando os passos bem-sucedidos dos que não tiveram o resultado esperado.
      - Registra todos esses dados (data/hora, pergunta, resposta, avaliação e cadeia organizada)
        em um único arquivo txt (em formato JSON) na pasta prompt.
    """
    print("=== Finalização da Consulta ===")
    rating = None
    while rating is None:
        try:
            rating_input = input("A resposta está condizente com a realidade? (0-5): ").strip()
            rating = int(rating_input)
            if rating < 0 or rating > 5:
                print("Insira um número entre 0 e 5.")
                rating = None
        except ValueError:
            print("Entrada inválida. Por favor, insira um número inteiro entre 0 e 5.")

    # Carrega a cadeia de queries consolidada
    metadata_chain = load_consolidated_metadata()

    # Exemplo simples de separação: 
    # Se o texto contiver 'answer' (em minúsculas) consideramos o passo como bem-sucedido.
    passos_certos = []
    passos_errados = []
    for item in metadata_chain:
        texto = item.get("text", "")
        if "answer" in texto.lower():
            passos_certos.append(item)
        else:
            passos_errados.append(item)

    # Cria a entrada de log com os dados da consulta
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "question": question,
        "final_answer": final_answer,
        "rating": rating,
        "chain": {
            "passos_certos": passos_certos,
            "passos_errados": passos_errados
        }
    }

    # Salva o log no arquivo de resumo (um registro por linha em formato JSON)
    try:
        os.makedirs(os.path.dirname(RESUMO_CONSULTAS_PATH), exist_ok=True)
        with open(RESUMO_CONSULTAS_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry, ensure_ascii=False, indent=2) + "\n")
        print(f"Consulta finalizada e registrada em {RESUMO_CONSULTAS_PATH}.")
    except Exception as e:
        print(f"Erro ao salvar o log: {e}")

    # Executa o script educ.py localmente
    subprocess.run(['python', 'educ.py'])

def get_previous_answer(question):
    """
    Verifica no arquivo de contexto se já existe uma resposta para a pergunta com avaliação 5.
    Se encontrada, retorna a resposta final; caso contrário, retorna None.
    A busca é feita por correspondência exata na chave 'question'.
    """
    if not os.path.exists(RESUMO_CONSULTAS_PATH):
        return None
    try:
        with open(RESUMO_CONSULTAS_PATH, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line)
                    if entry.get("question") == question and entry.get("rating") == 5:
                        return entry.get("final_answer")
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        print(f"Erro ao ler o arquivo de resumo: {e}")
    return None

if __name__ == "__main__":
    import sys
    # Exemplo de uso pela linha de comando.
    # Para finalizar uma consulta:
    #   python finalizacao.py "<pergunta>" "<resposta_final>"
    if len(sys.argv) < 3:
        print("Uso: python finalizacao.py \"<pergunta>\" \"<resposta_final>\"")
        sys.exit(1)
    
    question_arg = sys.argv[1]
    final_answer_arg = sys.argv[2]
    
    # Verifica se já existe uma resposta perfeita (rating 5) para a mesma pergunta
    previous = get_previous_answer(question_arg)
    if previous:
        print("Resposta previamente avaliada como perfeita (5):")
        print(previous)
    else:
        finalize_consulta(question_arg, final_answer_arg) 