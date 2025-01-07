import base64
import json
import logging
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

# Configuração da API key do Google
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY não configurada no ambiente")

genai.configure(api_key=GOOGLE_API_KEY)

# ... (other imports if needed) ...

class ClassificacaoTributaria:
    def __init__(self, monofasico, aliquota_zero, ipi_entrada, ipi_saida, pis_entrada, pis_saida, cofins_entrada, cofins_saida, cst_entrada, cst_saida):
        self.monofasico = monofasico
        self.aliquota_zero = aliquota_zero
        self.ipi_entrada = ipi_entrada
        self.ipi_saida = ipi_saida
        self.pis_entrada = pis_entrada
        self.pis_saida = pis_saida
        self.cofins_entrada = cofins_entrada
        self.cofins_saida = cofins_saida
        self.cst_entrada = cst_entrada
        self.cst_saida = cst_saida

def consulta_produto(consulta):
    """
    Consulta a classificação tributária de um produto usando o Gemini.
    """
    try:
        # Construir o prompt para o Gemini
        consulta = consulta.replace("{", "{{").replace("}", "}}")
        prompt = f"""
        Você é um especialista em classificação NCM e tributação de produtos.
        Analise o seguinte produto e gere um JSON com as seguintes informações:
        json {{ "ncm": "código NCM com 8 dígitos", "descricao": "descrição do produto", "atributos": ["lista de atributos do produto"], "atributos_tipis": ["lista de atributos da TIPI"], "classificacao_tributaria": {{ "monofasico": true/false, "aliquota_zero": true/false, "ipi_entrada": "valor ou 'não tributado'", "ipi_saida": "valor ou 'não tributado'", "pis_entrada": "valor ou 'não tributado'", "pis_saida": "valor ou 'não tributado'", "cofins_entrada": "valor ou 'não tributado'", "cofins_saida": "valor ou 'não tributado'", "cst_entrada": "valor ou 'sem CST'", "cst_saida": "valor ou 'sem CST'" }} }}
        Caso algum valor não seja aplicável, use "não tributado", "sem alíquota" ou "0%".
        Produto: {consulta}
        """

        logging.debug(f"Prompt enviado para Gemini: {prompt}")

        # Preparar a mensagem para o Gemini
        contents_b64 = base64.b64encode(json.dumps([{"role": "user", "parts": [{"text": prompt}]}]).encode('utf-8')).decode('utf-8')
        gais_contents = json.loads(base64.b64decode(contents_b64))

        # Chamar o modelo Gemini
        gemini = genai.GenerativeModel(model_name="gemini-2.0-flash-exp")
        response = gemini.generate_content(
            gais_contents,
            generation_config={"temperature": 0.2, "max_output_tokens": 500},
            safety_settings={},
            stream=False
        )

        content = response.text
        print(f"Resposta bruta do Gemini: {content}")  # Adicione esta linha para visualizar a resposta
        logging.debug(f"Resposta do Gemini: {content}")

    except json.JSONDecodeError as e:
        logging.error(f"Erro ao decodificar JSON da resposta: {e}")
        logging.error(f"Resposta bruta do Gemini: {content}")  # Adicione esta linha
            # ... (código para lidar com o erro, por exemplo, retornar um JSON de erro)
        try:
            data = json.loads(content)

            # Extrair informações do JSON
            ncm = data.get("ncm", "")
            descricao = data.get("descricao", "")
            atributos = data.get("atributos", [])
            atributos_tipis = data.get("atributos_tipis", [])
            classificacao_tributaria_data = data.get("classificacao_tributaria", {})

            # Criar objeto ClassificacaoTributaria
            classificacao_tributaria = ClassificacaoTributaria(
                monofasico=classificacao_tributaria_data.get("monofasico", False),
                aliquota_zero=classificacao_tributaria_data.get("aliquota_zero", False),
                ipi_entrada=classificacao_tributaria_data.get("ipi_entrada", "não tributado"),
                ipi_saida=classificacao_tributaria_data.get("ipi_saida", "não tributado"),
                pis_entrada=classificacao_tributaria_data.get("pis_entrada", "não tributado"),
                pis_saida=classificacao_tributaria_data.get("pis_saida", "não tributado"),
                cofins_entrada=classificacao_tributaria_data.get("cofins_entrada", "não tributado"),
                cofins_saida=classificacao_tributaria_data.get("cofins_saida", "não tributado"),
                cst_entrada=classificacao_tributaria_data.get("cst_entrada", "sem CST"),
                cst_saida=classificacao_tributaria_data.get("cst_saida", "sem CST"),
            )

            # Criar dicionário para o JSON de retorno
            resultado_json = {
                "ncm": classificacao_tributaria.ncm,
                "descricao": classificacao_tributaria.descricao,
                "atributos": classificacao_tributaria.atributos,
                "atributos_tipis": classificacao_tributaria.atributos_tipis,
                "classificacao_tributaria": {
                    "monofasico": classificacao_tributaria.monofasico,
                    "aliquota_zero": classificacao_tributaria.aliquota_zero,
                    "ipi_entrada": classificacao_tributaria.ipi_entrada,
                    "ipi_saida": classificacao_tributaria.ipi_saida,
                    "pis_entrada": classificacao_tributaria.pis_entrada,
                    "pis_saida": classificacao_tributaria.pis_saida,
                    "cofins_entrada": classificacao_tributaria.cofins_entrada,
                    "cofins_saida": classificacao_tributaria.cofins_saida,
                    "cst_entrada": classificacao_tributaria.cst_entrada,
                    "cst_saida": classificacao_tributaria.cst_saida
                }
            }

            # return json.dumps(resultado_json, indent=4)

            # # Criar objeto SugestaoProduto (se necessário)
            # sugestoes = [
            #     SugestaoProduto(  # Assumindo que SugestaoProduto é uma classe definida em outro lugar
            #         ncm=ncm,
            #         descricao=descricao,
            #         aliquotas={
            #             "ipi": data.get("aliquotas", {}).get("ipi", "0%"),
            #             "icms": data.get("aliquotas", {}).get("icms", {}),
            #             "pis": data.get("aliquotas", {}).get("pis", "1.65%"),
            #             "cofins": data.get("aliquotas", {}).get("cofins", "7.6%")
            #         },
            #         atributos_tipis=atributos_tipis,
            #         atributos=atributos,
            #         classificacao_tributaria=classificacao_tributaria
            #     )
            # ]

            # return sugestoes[0].classificacao_tributaria # Retornar o objeto ClassificacaoTributaria


        except json.JSONDecodeError as e:
            logging.error(f"Erro ao decodificar JSON da resposta: {e}")
            # ... (código para lidar com o erro) ...

        except Exception as e:
            logging.error(f"Erro ao consultar o produto: {e}")
            # ... (código para lidar com o erro) ...


# Exemplo de uso
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)  # Ajuste o nível de log conforme necessário

    consulta = "Qual a classificação tributária de um notebook apple 16 polegadas?"
    resultado = consulta_produto(consulta)

    print(resultado)  # ou faça o que for necessário com o resultado