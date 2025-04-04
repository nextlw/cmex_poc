#!/usr/bin/env python
"""
Script para download automático de atributos NCM.

Este script utiliza o certificado digital para autenticar com a API do Portal Único Siscomex,
consulta os atributos para cada código NCM da lista e salva os resultados em um arquivo JSON.

Uso:
    python download_ncm_attributes.py --output /caminho/para/arquivo.json --ncm-list lista.txt
    
Argumentos:
    --output: Caminho para o arquivo de saída (JSON). Padrão: app/schemas/atributos/atributos.json
    --ncm-list: Caminho para arquivo com lista de códigos NCM (um por linha)
    --cert: Caminho para o certificado digital
    --cert-pass: Senha do certificado digital
"""

import os
import sys
import json
import argparse
import asyncio
import logging
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

# Adiciona o diretório raiz para importação de módulos
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

from app.services.ncm_auth_service import NCMAuthService
from app.services.ncm_attributes_api_service import NCMAttributesAPIService

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("download_attributes.log")
    ]
)
logger = logging.getLogger(__name__)

# Lista padrão de códigos NCM comuns
DEFAULT_NCM_CODES = [
    "02011000", "02013000", "02023000", "03025100", 
    "04021010", "04051000", "07019000", "08051000", 
    "09011110", "10011900", "10059010", "11010010", 
    "15071000", "15079011", "17011400", "17019900", 
    "18063110", "19023000", "20057000", "21069010", 
    "22021000", "22030000", "23040010", "27101921"
]

async def download_attributes(
    ncm_codes: List[str], 
    output_file: str, 
    cert_path: Optional[str] = None,
    cert_password: Optional[str] = None
) -> bool:
    """
    Baixa atributos para uma lista de códigos NCM e salva em arquivo JSON.
    
    Args:
        ncm_codes: Lista de códigos NCM
        output_file: Caminho para o arquivo de saída
        cert_path: Caminho para o certificado digital
        cert_password: Senha do certificado digital
        
    Returns:
        bool: True se o download foi bem-sucedido
    """
    try:
        logger.info(f"Iniciando download de atributos para {len(ncm_codes)} códigos NCM")
        
        # Configuração do certificado no arquivo TOML
        if cert_path and os.path.exists(cert_path):
            config_path = "app/config/ncm_api_config.toml"
            
            # Se o arquivo de configuração existir, atualiza o caminho do certificado
            if os.path.exists(config_path):
                with open(config_path, "r") as f:
                    config_content = f.read()
                
                # Substitui o caminho do certificado
                import re
                config_content = re.sub(
                    r'caminho = ".*?"', 
                    f'caminho = "{cert_path}"', 
                    config_content
                )
                
                with open(config_path, "w") as f:
                    f.write(config_content)
                
                logger.info(f"Configuração atualizada com o certificado: {cert_path}")
            
            # Configura a variável de ambiente para a senha do certificado
            if cert_password:
                os.environ["CERT_PASSWORD"] = cert_password
        
        # Inicializa serviços
        auth_service = NCMAuthService()
        api_service = NCMAttributesAPIService(auth_service=auth_service)
        
        # Estrutura para armazenar todos os atributos
        all_attributes = {
            "metadata": {
                "date": datetime.datetime.now().isoformat(),
                "ncm_count": len(ncm_codes),
                "source": "Portal Único Siscomex API"
            },
            "ncm_codes": ncm_codes,
            "atributos": []
        }
        
        # Dicionário para evitar duplicação de atributos
        attribute_dict = {}
        
        # Para cada código NCM, obter atributos
        for i, ncm_code in enumerate(ncm_codes):
            try:
                logger.info(f"Processando NCM {i+1}/{len(ncm_codes)}: {ncm_code}")
                
                # Limpa o código NCM para garantir formato correto
                clean_ncm = "".join(c for c in ncm_code if c.isdigit())
                
                # Verifica se o código tem 8 dígitos
                if len(clean_ncm) != 8:
                    logger.warning(f"Código NCM inválido ignorado: {ncm_code}")
                    continue
                
                # Consulta atributos para o NCM
                attributes = await api_service.get_ncm_attributes(clean_ncm)
                
                # Processa os atributos
                if "atributos" in attributes and attributes["atributos"]:
                    for attr in attributes["atributos"]:
                        # Usa o código do atributo como identificador único
                        attr_code = attr.get("codigo")
                        if attr_code and attr_code not in attribute_dict:
                            # Adiciona o NCM atual à lista de NCMs do atributo
                            if "ncms" not in attr:
                                attr["ncms"] = []
                            
                            if clean_ncm not in attr["ncms"]:
                                attr["ncms"].append(clean_ncm)
                            
                            # Adiciona o atributo ao dicionário
                            attribute_dict[attr_code] = attr
                else:
                    logger.warning(f"Nenhum atributo encontrado para NCM: {ncm_code}")
                
                # Aguarda um pouco entre as requisições para não sobrecarregar a API
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Erro ao processar NCM {ncm_code}: {str(e)}")
                # Continua com o próximo NCM
                continue
        
        # Adiciona todos os atributos únicos à lista final
        all_attributes["atributos"] = list(attribute_dict.values())
        
        # Atualiza metadados
        all_attributes["metadata"]["attribute_count"] = len(all_attributes["atributos"])
        all_attributes["metadata"]["processed_ncm_count"] = len(ncm_codes)
        
        # Cria o diretório de saída se não existir
        os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
        
        # Salva o resultado em arquivo JSON
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(all_attributes, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Download concluído. {len(all_attributes['atributos'])} atributos salvos em {output_file}")
        return True
        
    except Exception as e:
        logger.error(f"Erro durante o download de atributos: {str(e)}")
        return False

def read_ncm_list(file_path: str) -> List[str]:
    """
    Lê uma lista de códigos NCM de um arquivo de texto.
    
    Args:
        file_path: Caminho para o arquivo com a lista
        
    Returns:
        List[str]: Lista de códigos NCM
    """
    try:
        with open(file_path, "r") as f:
            ncm_codes = [line.strip() for line in f if line.strip()]
        
        return ncm_codes
    except Exception as e:
        logger.error(f"Erro ao ler lista de NCMs: {str(e)}")
        return []

def parse_arguments():
    """
    Processa os argumentos de linha de comando.
    
    Returns:
        argparse.Namespace: Argumentos processados
    """
    parser = argparse.ArgumentParser(
        description="Download automático de atributos NCM usando certificado digital"
    )
    
    parser.add_argument(
        "--output", 
        type=str, 
        default="app/schemas/atributos/atributos.json",
        help="Caminho para o arquivo de saída (JSON)"
    )
    
    parser.add_argument(
        "--ncm-list", 
        type=str, 
        help="Caminho para arquivo com lista de códigos NCM (um por linha)"
    )
    
    parser.add_argument(
        "--cert", 
        type=str, 
        help="Caminho para o certificado digital"
    )
    
    parser.add_argument(
        "--cert-pass", 
        type=str, 
        help="Senha do certificado digital"
    )
    
    return parser.parse_args()

async def main():
    """Função principal do script."""
    # Processa argumentos
    args = parse_arguments()
    
    # Define a lista de NCMs
    ncm_codes = DEFAULT_NCM_CODES
    
    # Se foi fornecido um arquivo de lista, lê dele
    if args.ncm_list and os.path.exists(args.ncm_list):
        file_ncms = read_ncm_list(args.ncm_list)
        if file_ncms:
            ncm_codes = file_ncms
            logger.info(f"Usando {len(ncm_codes)} códigos NCM do arquivo {args.ncm_list}")
        else:
            logger.warning(f"Não foi possível ler códigos NCM do arquivo {args.ncm_list}. Usando lista padrão.")
    else:
        logger.info(f"Usando lista padrão com {len(ncm_codes)} códigos NCM")
    
    # Download dos atributos
    success = await download_attributes(
        ncm_codes=ncm_codes, 
        output_file=args.output,
        cert_path=args.cert,
        cert_password=args.cert_pass
    )
    
    if success:
        logger.info("Processo de download finalizado com sucesso")
    else:
        logger.error("Processo de download finalizado com erros")

if __name__ == "__main__":
    asyncio.run(main()) 