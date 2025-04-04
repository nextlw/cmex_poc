from typing import List, Dict, Any
import json
import logging
import aiohttp
from fastapi import HTTPException
import re

from ..config import SETTINGS, MODEL_MAPPING

logger = logging.getLogger(__name__)


def validar_tipo_tributario(tipo_tributario: dict | str) -> dict:
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
        # Verifica se a chave existe antes de atribuir
        if tipo_tributario in valores:
            valores[tipo_tributario] = True
        else:
            logger.warning(
                f"Chave de tipo_tributario inválida recebida como string: {tipo_tributario}"
            )
    elif isinstance(tipo_tributario, dict):
        # Garante que apenas chaves válidas do dicionário de entrada sejam usadas
        for key, value in tipo_tributario.items():
            if key in valores:
                valores[key] = bool(value)  # Garante que o valor seja booleano
            else:
                logger.warning(
                    f"Chave de tipo_tributario inválida recebida no dicionário: {key}"
                )
    else:
        logger.warning(f"Tipo inválido para tipo_tributario: {type(tipo_tributario)}")

    # Garante que apenas uma chave seja True (opcional, dependendo da regra de negócio)
    # Esta parte pode ser complexa e talvez não seja necessária se a fonte de dados for confiável.
    # Exemplo: encontrar a primeira chave True e definir as outras como False.
    # first_true_key = next((key for key, value in valores.items() if value), None)
    # if first_true_key:
    #     for key in valores:
    #         valores[key] = (key == first_true_key)
    
    return valores


def formatar_resposta(item: dict) -> Dict[str, Any]:
    """
    Formata um item de resposta para o formato esperado pelo frontend.
    Garante a presença de chaves essenciais com valores padrão.
    Remove chaves legadas como 'atributos' e 'atributos_tipi'.
    """
    # Garante que 'item' seja um dicionário
    if not isinstance(item, dict):
        logger.error(
            f"Formato inválido recebido em formatar_resposta: {type(item)}. Esperado dict."
        )
        # Retorna uma estrutura padrão de erro ou vazia
        return {
            "ncm": "",
            "descricao": "Erro: Formato de item inválido",
            "valores_de_impostos": {
                "ipi": "0%",
                "icms": {},
                "pis": "0%",
                "cofins": "0%",
            },
            "classificacao_tributaria": {},
            "atributos_detalhados": [],
        }

    # Extrai e valida o tipo_tributario
    tipo_tributario_raw = item.get("classificacao_tributaria", {}).get(
        "tipo_tributario", {}
    )
    # Passa o tipo raw para validação, garantindo que é dict ou str
    tipo_tributario = validar_tipo_tributario(
        tipo_tributario_raw if isinstance(tipo_tributario_raw, (dict, str)) else {}
    )
    
    # Garante a presença de classificacao_tributaria e seus campos
    classificacao = item.get("classificacao_tributaria", {}).copy()
    classificacao["tipo_tributario"] = tipo_tributario  # Adiciona o tipo validado
    campos_classificacao = [
        "ipi_entrada",
        "ipi_saida",
        "pis_entrada",
        "pis_saida",
        "cofins_entrada",
        "cofins_saida",
        "cst_entrada",
        "cst_saida",
    ]
    for campo in campos_classificacao:
        # Garante que o campo exista e tenha um valor padrão (string vazia)
        classificacao.setdefault(campo, "")

    # Garante a presença de valores_de_impostos e seus campos
    valores_impostos = item.get("valores_de_impostos", {}).copy()
    campos_impostos = ["ipi", "pis", "cofins", "icms"]
    for campo in campos_impostos:
        if campo not in valores_impostos:
            valores_impostos[campo] = {} if campo == "icms" else "0%"
        elif campo == "icms" and not isinstance(valores_impostos[campo], dict):
            logger.warning(
                f"Campo 'icms' em valores_de_impostos não era um dicionário. Resetando para {{}}."
            )
            valores_impostos[campo] = {}  # Garante que ICMS seja sempre dict
        elif campo != "icms" and not isinstance(valores_impostos[campo], str):
            # Converte para string se não for, ou define padrão 0%
            try:
                valores_impostos[campo] = str(valores_impostos[campo])
            except:
                logger.warning(
                    f"Não foi possível converter valor de imposto '{campo}' para string. Usando '0%'. Valor: {valores_impostos[campo]}"
                )
                valores_impostos[campo] = "0%"

    # Garante que atributos_detalhados seja uma lista
    atributos_detalhados = item.get("atributos_detalhados", [])
    if not isinstance(atributos_detalhados, list):
        logger.warning(
            f"Campo 'atributos_detalhados' não era uma lista. Resetando para []. Tipo recebido: {type(atributos_detalhados)}"
        )
        atributos_detalhados = []

    # Monta o dicionário de retorno FINAL, omitindo 'atributos' e 'atributos_tipi'
    return {
        "ncm": item.get("ncm", ""),
        "descricao": item.get("descricao", ""),
        # "atributos": atributos, # Removido
        # "atributos_tipi": atributos_tipi, # Removido
        "valores_de_impostos": valores_impostos,
        "classificacao_tributaria": classificacao,
        "atributos_detalhados": atributos_detalhados,  # A chave principal para atributos
    }


def processar_resposta_modelo(content: str) -> List[Dict[str, Any]]:
    """Processa a string de resposta do modelo LLM, tentando extrair um JSON."""
    try:
        # Tenta remover markdown de bloco de código se presente
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()

        # Tenta remover lixo antes/depois do JSON principal ( abordagem mais cuidadosa)
        json_start = content.find("{")
        json_end = content.rfind("}")
        list_start = content.find("[")
        list_end = content.rfind("]")

        cleaned_content = ""
        # Prioriza lista se ela envolver o conteúdo principal
        if (
            list_start != -1
            and list_end != -1
            and (json_start == -1 or list_start < json_start)
            and (json_end == -1 or list_end > json_end)
        ):
            cleaned_content = content[list_start : list_end + 1]
        elif json_start != -1 and json_end != -1:
            cleaned_content = content[json_start : json_end + 1]
        else:
            cleaned_content = content  # Mantém original se não encontrar JSON claro

        # NOVA LÓGICA: Corrigir problemas comuns em JSON que causan falhas de parsing
        # 1. Remover "..." que às vezes aparece em listas truncadas
        if "..." in cleaned_content:
            logger.warning("Detectado '...' em resposta JSON, tentando corrigir")
            # Substituir "item1", "item2", "item3", ... por "item1", "item2", "item3"
            cleaned_content = re.sub(r',\s*\.\.\.', '', cleaned_content)
            # Substituir [..., ...] por [...] (caso de lista truncada no final)
            cleaned_content = re.sub(r',\s*\.\.\.\s*\]', ']', cleaned_content)
            # Substituir [..., ... } por [...] } (caso de lista truncada dentro de objeto)
            cleaned_content = re.sub(r',\s*\.\.\.\s*\}', ']}', cleaned_content)
            # Substituir "atributos": ["item1", "item2", ... por "atributos": ["item1", "item2"
            cleaned_content = re.sub(r'(\[\s*"[^"]*"(?:,\s*"[^"]*")*),\s*\.\.\.', r'\1', cleaned_content)

        # 2. Tratar listas incompletas de atributos
        # Se ainda tiver problemas com a formatação após as correções acima
        try:
            # Tenta fazer o parse diretamente
            resultado_raw = json.loads(cleaned_content)
        except json.JSONDecodeError as e:
            logger.warning(f"Erro ao decodificar JSON, tentando recuperação: {e}")
            
            # Essa parte é mais arriscada - tenta reparar JSON parcial
            # Verifica se há uma lista de atributos incompleta
            atributos_match = re.search(r'"atributos"\s*:\s*\[(.*?)(?:\]|}|$)', cleaned_content, re.DOTALL)
            if atributos_match:
                atributos_content = atributos_match.group(1).strip()
                # Se a lista estiver truncada (não termina com ]), conserta
                if not atributos_content.rstrip().endswith("]"):
                    # Fecha a lista de atributos adequadamente
                    fixed_content = re.sub(
                        r'("atributos"\s*:\s*\[.*?)(?:,\s*\.\.\.)?(?=\s*[}\]]|$)', 
                        r'\1]', 
                        cleaned_content, 
                        flags=re.DOTALL
                    )
                    logger.info(f"Tentativa de reparo da lista de atributos: {fixed_content[:200]}...")
                    try:
                        resultado_raw = json.loads(fixed_content)
                        logger.info("Reparo bem-sucedido!")
                        cleaned_content = fixed_content  # Atualiza para o conteúdo corrigido
                    except json.JSONDecodeError:
                        # Se ainda falhar, tenta um reparo mais agressivo
                        logger.warning("Reparo inicial falhou, tentando método mais agressivo")
                        try:
                            # Extrai o que conseguir até a parte que parece quebrada
                            if json_start != -1 and json_end != -1:
                                # Cria um JSON mínimo válido
                                minimal_json = cleaned_content[:json_start+1] + '"error": "Resposta truncada"' + cleaned_content[json_end:]
                                resultado_raw = json.loads(minimal_json)
                                logger.info("Reparo agressivo bem-sucedido com JSON mínimo")
                            else:
                                # Se tudo falhar, retorna um objeto vazio
                                resultado_raw = {"error": "Falha ao processar JSON truncado"}
                        except:
                            resultado_raw = {"error": "Falha ao processar JSON truncado"}
            else:
                # Se não encontrar uma lista de atributos para reparar, retorna erro
                resultado_raw = {"error": "Falha ao processar JSON, formato inesperado"}

        # Garante que o resultado seja sempre uma lista de dicionários formatados
        lista_formatada = []
        if isinstance(resultado_raw, dict):
            # Se for um dicionário, verifica chaves comuns que contêm a lista
            if "sugestoes" in resultado_raw and isinstance(
                resultado_raw["sugestoes"], list
            ):
                for item in resultado_raw["sugestoes"]:
                    # Valida se item é um dicionário antes de formatar
                    if isinstance(item, dict):
                        lista_formatada.append(formatar_resposta(item))
                    else:
                        logger.warning(
                            f"Item inválido encontrado na lista 'sugestoes': {type(item)}"
                        )
            elif "items" in resultado_raw and isinstance(resultado_raw["items"], list):
                for item in resultado_raw["items"]:
                    # Valida se item é um dicionário antes de formatar
                    if isinstance(item, dict):
                        lista_formatada.append(formatar_resposta(item))
                    else:
                        logger.warning(
                            f"Item inválido encontrado na lista 'items': {type(item)}"
                        )
            else:
                # Se não encontrar lista, assume que o dict é o item único
                lista_formatada.append(formatar_resposta(resultado_raw))
        elif isinstance(resultado_raw, list):
            # Se já for uma lista, formata cada item
            for item in resultado_raw:
                # Valida se item é um dicionário antes de formatar
                if isinstance(item, dict):
                    lista_formatada.append(formatar_resposta(item))
                else:
                    logger.warning(
                        f"Item inválido encontrado na lista principal: {type(item)}"
                    )
        else:
            raise ValueError("Conteúdo JSON não é uma lista ou dicionário esperado.")

        return lista_formatada

    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {e}")
        logger.error(
            f"Conteúdo recebido (cleaned): {cleaned_content}"
        )  # Log do conteúdo problemático
        return [
            formatar_resposta(
                {
                    "error": "Falha ao processar resposta da LLM.",
                    "details": str(e),
                    "received_content": content[:200]
                    + "...",  # Envia conteúdo original truncado
                }
            )
        ]
    except ValueError as e:
        logger.error(f"Erro no valor processado: {e}")
        logger.error(f"Conteúdo recebido: {content[:500]}...")
        return [
            formatar_resposta(
                {
                    "error": "Formato de resposta inesperado da LLM.",
                    "details": str(e),
                    "received_content": content[:200] + "...",
                }
            )
        ]
    except Exception as e:
        logger.error(f"Erro inesperado ao processar resposta: {e}", exc_info=True)
        return [
            formatar_resposta(
                {
                    "error": "Erro interno ao processar resposta da LLM.",
                    "details": str(e),
                    "received_content": content[:200] + "...",
                }
            )
        ]


async def filtrar_atributos_relevantes_com_llm(
    descricao_produto: str, atributos: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Usa o modelo Qwen local para filtrar atributos NCM relevantes para uma descrição."""
    if not atributos:
        return []
    if not descricao_produto:
        logger.info("Descrição do produto vazia, retornando todos os atributos.")
        return atributos  # Retorna todos se não houver descrição

    try:
        model_config = MODEL_MAPPING["qwen2.5-7b-instruct-1m"]
        # Limita o tamanho da string JSON para evitar prompts excessivamente longos
        # (Pode ser necessário ajustar o limite ou usar paginação/chunking para listas muito grandes)
        try:
            atributos_json_str = json.dumps(atributos, ensure_ascii=False, indent=2)
            if len(atributos_json_str) > 15000:  # Limite arbitrário de caracteres
                logger.warning(
                    f"Lista de atributos ({len(atributos_json_str)} chars) excede limite para LLM, truncando."
                )
                # Estratégia simples: truncar a string JSON (pode quebrá-lo)
                # Idealmente, seria melhor truncar a lista de atributos antes de serializar.
                atributos_json_str = (
                    atributos_json_str[:15000] + "...\n]"
                )  # Tenta fechar o JSON
        except Exception as json_e:
            logger.error(f"Erro ao serializar atributos para LLM: {json_e}")
            return atributos  # Retorna original se não puder serializar

        prompt = f"""
Dada a descrição do produto: '{descricao_produto}'

E a lista completa de atributos NCM em formato JSON (pode estar truncada):
{atributos_json_str}

Analise a descrição e a lista de atributos. Retorne APENAS um JSON válido contendo uma chave "atributos_filtrados" com a lista SOMENTE dos objetos JSON dos atributos que são mais relevantes para esta descrição específica. Mantenha a estrutura original de cada objeto de atributo selecionado. Se nenhum atributo parecer relevante, retorne uma lista vazia dentro da chave "atributos_filtrados". Não inclua explicações.
"""

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{SETTINGS.LOCAL_MODEL_URL}/v1/chat/completions",
                json={
                    "model": model_config["model_name"],
                    "messages": [
                        {
                            "role": "system",
                            "content": "Você é um assistente especializado em análise de dados fiscais. Sua tarefa é filtrar listas de atributos NCM com base na relevância para uma descrição de produto. Responda APENAS com o JSON solicitado.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,  # Baixa temperatura para mais determinismo na filtragem
                    "max_tokens": 2048,  # Aumentar se a lista de atributos for muito grande
                    "response_format": {
                        "type": "json_schema"
                    },  # Solicita explicitamente JSON
                    "stream": False,
                },
                timeout=aiohttp.ClientTimeout(
                    total=60
                ),  # Timeout de 60s para a chamada LLM
            ) as response:

                if response.status != 200:
                    error_text = await response.text()
                    logger.error(
                        f"Erro {response.status} da API do modelo local ao filtrar atributos: {error_text}"
                    )
                    # Em caso de erro da LLM, retorna a lista original sem filtrar
                    return atributos

                result = await response.json()

                if not result.get("choices") or not result["choices"][0].get("message"):
                    logger.warning(
                        "Resposta inválida do modelo local ao filtrar atributos"
                    )
                    return atributos  # Retorna original em caso de resposta inválida

                content = result["choices"][0]["message"]["content"].strip()

                try:
                    # Tenta remover markdown de bloco de código se presente
                    if content.startswith("```json"):
                        content = content[7:-3].strip()
                    elif content.startswith("```"):
                        content = content[3:-3].strip()

                    # Tenta encontrar o JSON objeto dentro da resposta
                    json_start = content.find("{")
                    json_end = content.rfind("}")
                    if json_start != -1 and json_end != -1:
                        content = content[json_start : json_end + 1]
                    else:
                        logger.warning(
                            f"Não foi possível encontrar um objeto JSON na resposta da LLM: {content[:200]}..."
                        )
                        return atributos  # Retorna original

                    resposta_json = json.loads(content)

                    if (
                        isinstance(resposta_json, dict)
                        and "atributos_filtrados" in resposta_json
                        and isinstance(resposta_json["atributos_filtrados"], list)
                    ):
                        logger.info(
                            f"[INFO] Atributos filtrados pela LLM: {len(resposta_json['atributos_filtrados'])} de {len(atributos)}"
                        )
                        # Validação básica: verifica se os itens são dicionários
                        atributos_validados = [
                            attr
                            for attr in resposta_json["atributos_filtrados"]
                            if isinstance(attr, dict)
                        ]
                        if len(atributos_validados) != len(
                            resposta_json["atributos_filtrados"]
                        ):
                            logger.warning(
                                "Alguns itens retornados em 'atributos_filtrados' não eram dicionários."
                            )
                        return atributos_validados
                    else:
                        logger.warning(
                            f"Formato de resposta JSON inesperado da LLM ao filtrar atributos: {resposta_json}"
                        )
                        return atributos  # Retorna original

                except json.JSONDecodeError:
                    logger.error(
                        f"Erro ao decodificar JSON da LLM ao filtrar atributos. Conteúdo: {content[:200]}..."
                    )
                    return atributos  # Retorna original
                except Exception as e:
                    logger.error(
                        f"Erro ao processar resposta da LLM ao filtrar atributos: {e}",
                        exc_info=True,
                    )
                    return atributos  # Retorna original

    except aiohttp.ClientError as e:
        logger.error(f"Erro de conexão com modelo local ao filtrar atributos: {str(e)}")
        return atributos  # Retorna original em caso de erro de conexão
    except Exception as e:
        logger.error(f"Erro inesperado ao filtrar atributos: {str(e)}", exc_info=True)
        # Em caso de erro inesperado, retorna a lista original
        return atributos
