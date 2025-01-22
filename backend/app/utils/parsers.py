from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

def validar_tipo_tributario(tipo_tributario: dict) -> dict:
    """
    Valida e formata o tipo_tributario, garantindo que apenas um valor seja true.
    """
    valores = {
        "monofasico": False,
        "aliquota_zero": False,
        "isento": False,
        "suspenso": False
    }
    
    if isinstance(tipo_tributario, str):
        valores[tipo_tributario] = True
    else:
        valores.update(tipo_tributario)
    
    return valores

def formatar_resposta(item: dict) -> Dict[str, Any]:
    """
    Formata um item de resposta para o formato esperado pelo frontend.
    
    Args:
        item: Dicionário com os dados da resposta
        
    Returns:
        Dicionário no formato esperado pelo frontend
    """
    # Extrai e valida o tipo_tributario
    tipo_tributario = validar_tipo_tributario(
        item.get("classificacao_tributaria", {}).get("tipo_tributario", {})
    )
    
    # Extrai a classificação tributária
    classificacao = item.get("classificacao_tributaria", {}).copy()
    classificacao["tipo_tributario"] = tipo_tributario
    
    return {
        "ncm": item.get("ncm", ""),
        "descricao": item.get("descricao", ""),
        "atributos": item.get("atributos", []),
        "atributos_tipi": item.get("atributos_tipi", []),
        "valores_de_impostos": {
            "ipi": item.get("valores_de_impostos", {}).get("ipi", "0%"),
            "icms": item.get("valores_de_impostos", {}).get("icms", {}),
            "pis": item.get("valores_de_impostos", {}).get("pis", "1.65%"),
            "cofins": item.get("valores_de_impostos", {}).get("cofins", "7.6%"),
        },
        "classificacao_tributaria": classificacao
    }

def processar_resposta_modelo(content: str) -> List[Dict[str, Any]]:
    """
    Processa a resposta do modelo, garantindo um formato consistente para o frontend.
    
    Args:
        content: String contendo o JSON retornado pelo modelo
    
    Returns:
        Lista de dicionários no formato esperado pelo frontend
    """
    try:
        # Parse do JSON
        data = json.loads(content)
        
        # Garante que é uma lista
        if not isinstance(data, list):
            data = [data]
            
        # Formata cada item da resposta
        resultado = [formatar_resposta(item) for item in data]
        
        logger.info(f"Resposta processada com sucesso: {resultado}")
        return resultado
        
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Erro ao processar resposta: {str(e)}")
        raise 