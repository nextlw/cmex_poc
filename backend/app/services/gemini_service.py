import base64
import json
import logging
import os
from typing import Dict, Any
import google.generativeai as genai
from ..utils.constants import PROMPT_TEMPLATE

logger = logging.getLogger(__name__)

# Configuração da API key do Google
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY não configurada no ambiente")

genai.configure(api_key=GOOGLE_API_KEY)

class GeminiService:
    def __init__(self):
        """Inicializa o modelo Gemini."""
        self.model = genai.GenerativeModel('gemini-pro')

    def consulta_produto(self, consulta: str) -> Dict[str, Any]:
        """Consulta o produto usando o modelo Gemini."""
        try:
            consulta_formatada = consulta.replace("{", "{{").replace("}", "}}")
            prompt = PROMPT_TEMPLATE.format(consulta=consulta_formatada)
            
            logger.debug(f"Prompt enviado para Gemini: {prompt}")
            
            response = self.model.generate_content(prompt)
            
            if response.text:
                return json.loads(response.text)
            else:
                raise ValueError("Resposta vazia do Gemini")
            
        except Exception as e:
            logger.error(f"Erro ao consultar Gemini: {str(e)}")
            raise
