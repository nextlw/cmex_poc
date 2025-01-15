from fastapi import APIRouter, HTTPException
import google.generativeai as genai
from ...config import settings, MODEL_MAPPING, ERROR_MESSAGES
from ...models.schemas import (
    ConsultaProduto,
    SugerirNCM,
    ValoresdeImpostos,
    ClassificacaoTributaria
)
import time
import logging
import json
from line_profiler import LineProfiler, profile
import sys

from .claude import obter_sugestoes_claude
from .gemini import obter_sugestoes_gemini
from .gpt import obter_sugestoes_gpt4

# Cria um router para o endpoint /queries
queries_router = APIRouter()

# Define as funções a serem chamadas de acordo com o modelo recebido
funcoes_modelos = {
    "Nexcode-0.1-BETA" : obter_sugestoes_gemini,
    "Nex-0.1-Pro-2024" : obter_sugestoes_gpt4,
    "Nex-0.3-Preview-2024" : obter_sugestoes_claude
}

@queries_router.post("/queries")
async def queries(consulta_produto: ConsultaProduto):
    
    print(":::::::::QUERIES:::::::::")
    
    # Seleciona a função a ser executada de acordo com o modelo
    funcao_escolhida = funcoes_modelos.get(consulta_produto.modelo)
    
    # TODO: Verifica se o modelo escolhido é válido
    if not funcao_escolhida:
        return "Erro"
    
    # Executa a função de IA
    resultado = await funcao_escolhida(consulta_produto)
    
    # Envia o resultado de volta para o frontend
    return resultado