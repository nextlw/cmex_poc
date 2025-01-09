PROMPT_TEMPLATE = """
Você é um especialista em classificação NCM e tributação de produtos.
Analise o seguinte produto e gere um JSON com as seguintes informações:
json {{ 
    "ncm": "código NCM com 8 dígitos",
    "descricao": "descrição do produto",
    "atributos": ["lista de atributos do produto"],
    "atributos_tipis": ["lista de atributos da TIPI"],
    "classificacao_tributaria": {{
        "monofasico": true/false,
        "aliquota_zero": true/false,
        "ipi_entrada": "valor ou 'não tributado'",
        "ipi_saida": "valor ou 'não tributado'",
        "pis_entrada": "valor ou 'não tributado'",
        "pis_saida": "valor ou 'não tributado'",
        "cofins_entrada": "valor ou 'não tributado'",
        "cofins_saida": "valor ou 'não tributado'",
        "cst_entrada": "valor ou 'sem CST'",
        "cst_saida": "valor ou 'sem CST'"
    }}
}}
Caso algum valor não seja aplicável, use "não tributado", "sem alíquota" ou "0%".
Produto: {consulta}
"""
