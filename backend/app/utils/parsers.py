from typing import List, Dict, Any
from ..models.schemas import SugerirNCM, ValoresdeImpostos, ClassificacaoTributaria, TipoTributario
import json
import logging

logger = logging.getLogger(__name__)

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
            
        # Cria objetos SugerirNCM
        sugestoes = [criar_sugestao_ncm(item) for item in data]
        
        # Converte para o formato do frontend
        resultado = [sugestao.to_frontend_format() for sugestao in sugestoes]
        
        logger.info(f"Resposta processada com sucesso: {resultado}")
        return resultado
        
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Erro ao processar resposta: {str(e)}")
        raise

def criar_sugestao_ncm(item: dict) -> SugerirNCM:
    """Cria um objeto SugerirNCM a partir de um dicionário de dados."""
    tipo_tributario = item.get("classificacao_tributaria", {}).get("tipo_tributario", {})
    if isinstance(tipo_tributario, str):
        tipo_tributario = {
            "monofasico": tipo_tributario == "monofasico",
            "aliquota_zero": tipo_tributario == "aliquota_zero",
            "isento": tipo_tributario == "isento",
            "suspenso": tipo_tributario == "suspenso"
        }
    
    return SugerirNCM(
        ncm=item.get("ncm", ""),
        descricao=item.get("descricao", ""),
        atributos=item.get("atributos", []),
        atributos_tipi=item.get("atributos_tipi", []),
        valores_de_impostos=ValoresdeImpostos(
            ipi=item.get("valores_de_impostos", {}).get("ipi", "0%"),
            icms=item.get("valores_de_impostos", {}).get("icms", {}),
            pis=item.get("valores_de_impostos", {}).get("pis", "1.65%"),
            cofins=item.get("valores_de_impostos", {}).get("cofins", "7.6%"),
        ),
        classificacao_tributaria=ClassificacaoTributaria(
            tipo_tributario=TipoTributario(
                monofasico=tipo_tributario.get("monofasico", False),
                aliquota_zero=tipo_tributario.get("aliquota_zero", False),
                isento=tipo_tributario.get("isento", False),
                suspenso=tipo_tributario.get("suspenso", False)
            ),
            ipi_entrada=item.get("classificacao_tributaria", {}).get("ipi_entrada", ""),
            ipi_saida=item.get("classificacao_tributaria", {}).get("ipi_saida", ""),
            pis_entrada=item.get("classificacao_tributaria", {}).get("pis_entrada", ""),
            pis_saida=item.get("classificacao_tributaria", {}).get("pis_saida", ""),
            cofins_entrada=item.get("classificacao_tributaria", {}).get("cofins_entrada", ""),
            cofins_saida=item.get("classificacao_tributaria", {}).get("cofins_saida", ""),
            cst_entrada=item.get("classificacao_tributaria", {}).get("cst_entrada", ""),
            cst_saida=item.get("classificacao_tributaria", {}).get("cst_saida", "")
        )
    ) 