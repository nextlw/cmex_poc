from fastapi import APIRouter
import csv
import os
from datetime import datetime
import json
from typing import List
from ..models.schemas import SugerirNCM

historico_router = APIRouter()
CSV_FILE = "historico_consultas.csv"

def gerar_id(modelo: str) -> str:
    ano = datetime.now().year
    inicial = modelo[0].upper()
    
    # Lê o último ID do arquivo
    ultimo_id = 0
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if row['id'].startswith(f"{ano}{inicial}"):
                    num = int(row['id'][5:])
                    ultimo_id = max(ultimo_id, num)
    
    novo_num = str(ultimo_id + 1).zfill(5)
    return f"{ano}{inicial}{novo_num}"

@historico_router.post("/historico")
async def salvar_historico(sugestao: SugerirNCM, modelo: str):
    id_consulta = gerar_id(modelo)
    timestamp = datetime.now().isoformat()
    
    # Prepara os dados para o CSV
    dados = {
        "id": id_consulta,
        "modelo": modelo,
        "timestamp": timestamp,
        "ncm": sugestao.ncm,
        "descricao": sugestao.descricao,
        "atributos": json.dumps(sugestao.atributos),
        "atributos_tipi": json.dumps(sugestao.atributos_tipi),
        "valores_impostos": json.dumps(sugestao.valores_de_impostos),
        "classificacao_tributaria": json.dumps(sugestao.classificacao_tributaria)
    }
    
    # Verifica se o arquivo existe
    arquivo_existe = os.path.exists(CSV_FILE)
    
    # Abre o arquivo em modo append
    with open(CSV_FILE, 'a', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=dados.keys())
        if not arquivo_existe:
            writer.writeheader()
        writer.writerow(dados)
    
    return {"id": id_consulta}

@historico_router.get("/historico")
async def obter_historico():
    if not os.path.exists(CSV_FILE):
        return []
    
    historico = []
    with open(CSV_FILE, 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            historico.append({
                "id": row["id"],
                "modelo": row["modelo"],
                "timestamp": row["timestamp"],
                "ncm": row["ncm"],
                "descricao": row["descricao"],
                "atributos": json.loads(row["atributos"]),
                "atributos_tipi": json.loads(row["atributos_tipi"]),
                "valores_impostos": json.loads(row["valores_impostos"]),
                "classificacao_tributaria": json.loads(row["classificacao_tributaria"])
            })
    
    return sorted(historico, key=lambda x: x["timestamp"], reverse=True) 