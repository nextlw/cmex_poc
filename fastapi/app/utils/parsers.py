from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

def validar_tipo_tributario(tipo_tributario: dict) -> dict:
    """
    Valida e formata o tipo_tributario, garantindo que apenas um valor seja true.
    """
    valores = {
        "01_operacao_tributavel_base_calculo_positiva": False,
        "02_operacao_tributavel_base_calculo_negativa": False,
        "03_operacao_tributavel_base_calculo_zero": False,
        "04_operacao_tributavel_monofasica": False,
        "05_operacao_tributavel_st": False,
        "06_operacao_tributavel_aliquota_zero": False,
        "07_operacao_isenta": False,
        "08_operacao_sem_incidencia": False,
        "09_operacao_com_suspensao": False,
        "49_outras_operacoes_saida": False,
        "50_operacao_direito_credito_vinculada": False,
        "51_operacao_direito_credito_nao_vinculada": False,
        "52_operacao_direito_credito_vinculada_zero": False,
        "53_operacao_direito_credito_vinculada_outros": False,
        "54_operacao_direito_credito_nao_vinculada_zero": False,
        "55_operacao_direito_credito_nao_vinculada_outros": False,
        "56_credito_presumido": False,
        "60_credito_vinculado_importacao": False,
        "61_credito_vinculado_importacao_zero": False,
        "62_credito_vinculado_importacao_aliquota_diferenciada": False,
        "63_credito_vinculado_importacao_uso_capacidade": False,
        "64_credito_vinculado_importacao_zero_uso_capacidade": False,
        "65_credito_vinculado_importacao_aliquota_diferenciada_uso_capacidade": False,
        "66_credito_vinculado_importacao_recursos": False,
        "67_credito_vinculado_importacao_zero_recursos": False,
        "70_operacao_aquisicao_sem_direito_credito": False,
        "71_operacao_aquisicao_sem_direito_credito_zero": False,
        "72_operacao_aquisicao_sem_direito_credito_aliquota_diferenciada": False,
        "73_operacao_aquisicao_sem_direito_credito_st": False,
        "74_operacao_aquisicao_sem_direito_credito_aliquota_zero": False,
        "75_operacao_aquisicao_sem_direito_credito_isencao": False,
        "98_outras_operacoes_entrada": False,
        "99_outras_operacoes": False,
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

def processar_resposta_modelo(content: str) -> list:
    """Processa a resposta do modelo, garantindo um formato consistente."""
    try:
        # Remove delimitadores de código markdown se presentes
        content = content.replace('```json', '').replace('```', '').strip()
        
        # Remove qualquer texto antes do primeiro {
        content = content[content.find('{'):]
        
        # Remove qualquer texto após o último }
        content = content[:content.rfind('}')+1]
        
        # Tenta fazer o parse do JSON
        data = json.loads(content)
        
        # Se a resposta for um dicionário, converte para lista
        if isinstance(data, dict):
            data = [data]
            
        # Garante que cada item tem todos os campos necessários
        for item in data:
            # Garante que classificacao_tributaria existe
            if 'classificacao_tributaria' not in item:
                item['classificacao_tributaria'] = {}
            
            # Garante que valores_de_impostos existe
            if 'valores_de_impostos' not in item:
                item['valores_de_impostos'] = {}
            
            # Garante que icms existe em valores_de_impostos
            if 'icms' not in item['valores_de_impostos']:
                item['valores_de_impostos']['icms'] = {}
            
            # Garante que atributos e atributos_tipi são listas
            if 'atributos' not in item:
                item['atributos'] = []
            if 'atributos_tipi' not in item:
                item['atributos_tipi'] = []
            
            # Garante que os campos de texto existem
            campos_texto = ['ncm', 'descricao']
            for campo in campos_texto:
                if campo not in item:
                    item[campo] = ''
            
            # Garante que os campos de classificação tributária existem
            campos_classificacao = [
                'ipi_entrada', 'ipi_saida',
                'pis_entrada', 'pis_saida',
                'cofins_entrada', 'cofins_saida',
                'cst_entrada', 'cst_saida'
            ]
            for campo in campos_classificacao:
                if campo not in item['classificacao_tributaria']:
                    item['classificacao_tributaria'][campo] = ''
            
            # Garante que os campos de valores de impostos existem
            campos_impostos = ['ipi', 'pis', 'cofins']
            for campo in campos_impostos:
                if campo not in item['valores_de_impostos']:
                    item['valores_de_impostos'][campo] = ''
        
        return data
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {e}\nConteúdo recebido: {content[:500]}")
        raise
    except Exception as e:
        logger.error(f"Erro ao processar resposta: {e}")
        raise 