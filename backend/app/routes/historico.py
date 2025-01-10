from fastapi import APIRouter, HTTPException
import csv
import os
from datetime import datetime
import json
from typing import Dict, Any
import logging

historico_router = APIRouter()

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define o diretório para armazenar os dados
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
CSV_FILE = os.path.join(DATA_DIR, "historico_consultas.csv")

# Garante que o diretório data existe
os.makedirs(DATA_DIR, exist_ok=True)

CSV_HEADERS = [
    "id",
    "modelo",
    "timestamp",
    "consulta",
    "ncm",
    "descricao",
    "atributos",
    "atributos_tipi",
    "valores_impostos",
    "classificacao_tributaria"
]

def criar_arquivo_csv():
    """Cria o arquivo CSV com os cabeçalhos se ele não existir"""
    if not os.path.exists(CSV_FILE):
        try:
            with open(CSV_FILE, 'w', newline='', encoding='utf-8') as file:
                writer = csv.DictWriter(file, fieldnames=CSV_HEADERS)
                writer.writeheader()
            logging.info(f"Arquivo {CSV_FILE} criado com sucesso")
        except Exception as e:
            logging.error(f"Erro ao criar arquivo {CSV_FILE}: {str(e)}")
            raise

def gerar_id(modelo: str) -> str:
    ano = datetime.now().year
    inicial = modelo[0].upper()
    
    ultimo_id = 0
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if row['id'].startswith(f"{ano}{inicial}"):
                    try:
                        num = int(row['id'][5:])
                        ultimo_id = max(ultimo_id, num)
                    except ValueError:
                        continue
    
    novo_num = str(ultimo_id + 1).zfill(5)
    return f"{ano}{inicial}{novo_num}"

@historico_router.post("/historico")
async def salvar_historico(dados: Dict[str, Any]):
    try:
        logger.info(f"Recebendo dados para salvar: {dados}")
        
        # Garante que o diretório data existe
        os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)
        
        # Garante que o arquivo existe
        criar_arquivo_csv()
        
        id_consulta = gerar_id(dados.get('modelo', 'X'))
        timestamp = datetime.now().isoformat()
        
        registro = {
            "id": id_consulta,
            "modelo": dados.get('modelo'),
            "timestamp": timestamp,
            "consulta": dados.get('consulta'),
            "ncm": dados.get('ncm'),
            "descricao": dados.get('descricao'),
            "atributos": json.dumps(dados.get('atributos', []), ensure_ascii=False),
            "atributos_tipi": json.dumps(dados.get('atributos_tipi', []), ensure_ascii=False),
            "valores_impostos": json.dumps(dados.get('valores_de_impostos', {}), ensure_ascii=False),
            "classificacao_tributaria": json.dumps(dados.get('classificacao_tributaria', {}), ensure_ascii=False)
        }
        
        logger.info(f"Registro formatado: {registro}")
        
        # Abre o arquivo em modo append
        with open(CSV_FILE, 'a', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=CSV_HEADERS)
            writer.writerow(registro)
        
        logger.info(f"Registro salvo com sucesso. ID: {id_consulta}")
        return {"success": True, "id": id_consulta}
        
    except Exception as e:
        logger.error(f"Erro ao salvar histórico: {str(e)}")
        logger.exception("Detalhes do erro:")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao salvar histórico: {str(e)}"
        )

@historico_router.get("/historico")
async def obter_historico():
    try:
        # Garante que o arquivo existe
        criar_arquivo_csv()
        
        historico = []
        with open(CSV_FILE, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                try:
                    item = {
                        "id": row["id"],
                        "modelo": row["modelo"],
                        "timestamp": row["timestamp"],
                        "ncm": row["ncm"],
                        "descricao": row["descricao"],
                        "atributos": json.loads(row["atributos"]) if row["atributos"] else [],
                        "atributos_tipi": json.loads(row["atributos_tipi"]) if row["atributos_tipi"] else [],
                        "valores_de_impostos": json.loads(row["valores_impostos"]) if row["valores_impostos"] else {},
                    }
                    historico.append(item)
                except Exception as e:
                    logging.error(f"Erro ao processar linha do CSV: {e}")
                    continue
        
        return historico
        
    except Exception as e:
        logging.error(f"Erro ao ler histórico: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 