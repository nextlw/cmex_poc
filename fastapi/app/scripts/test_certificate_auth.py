#!/usr/bin/env python
"""
Script para testar a autenticação com certificado digital no Portal Único Siscomex.

Este script verifica se o certificado digital está válido e consegue realizar
a autenticação com sucesso, obtendo os tokens JWT e CSRF necessários para
acessar as APIs do Portal Único Siscomex.

Uso:
    python test_certificate_auth.py --cert /caminho/certificado.pfx [--cert-pass senha]

Se a senha não for fornecida via linha de comando, o script tentará obter da
variável de ambiente CERT_PASSWORD.
"""

import os
import sys
import json
import asyncio
import argparse
import logging
import datetime
from pathlib import Path
from typing import Dict, Any, Optional

# Adiciona o diretório raiz para importação de módulos
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

from app.services.ncm_auth_service import NCMAuthService
from app.utils.certificate_converter import get_certificate_info, convert_crt_to_pfx

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("certificate_auth_test.log")
    ]
)
logger = logging.getLogger(__name__)

async def test_auth(cert_path: str, cert_password: str, auth_url: Optional[str] = None) -> bool:
    """
    Testa a autenticação com certificado digital.
    
    Args:
        cert_path: Caminho para o certificado digital
        cert_password: Senha do certificado
        auth_url: URL de autenticação (opcional, usa a padrão se não fornecida)
        
    Returns:
        bool: True se a autenticação foi bem-sucedida
    """
    try:
        logger.info(f"Iniciando teste de autenticação com certificado: {cert_path}")
        
        # Verifica o formato do certificado
        cert_ext = Path(cert_path).suffix.lower()
        
        # Se for .crt, converte para .pfx
        if cert_ext == '.crt':
            logger.info("Certificado no formato .crt detectado, convertendo para .pfx")
            temp_dir = "temp_certs"
            os.makedirs(temp_dir, exist_ok=True)
            
            pfx_path = os.path.join(temp_dir, f"{Path(cert_path).stem}.pfx")
            
            try:
                convert_crt_to_pfx(cert_path, pfx_path, cert_password)
                logger.info(f"Certificado convertido com sucesso: {pfx_path}")
                cert_path = pfx_path
            except Exception as e:
                logger.error(f"Erro ao converter certificado: {str(e)}")
                return False
        
        # Obtém informações do certificado
        try:
            cert_info = get_certificate_info(cert_path, cert_password)
            
            logger.info("Informações do certificado:")
            logger.info(f"  Sujeito: {cert_info.get('subject')}")
            logger.info(f"  Emissor: {cert_info.get('issuer')}")
            logger.info(f"  Válido até: {cert_info.get('not_valid_after')}")
            logger.info(f"  Número de série: {cert_info.get('serial_number')}")
            
            # Verifica se o certificado está expirado
            if cert_info.get('is_expired', False):
                logger.error("ERRO: Certificado expirado!")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao obter informações do certificado: {str(e)}")
            # Continua mesmo sem conseguir obter informações, pois pode ser um problema
            # na extração das informações e não no certificado em si
        
        # Configura o serviço de autenticação
        config_path = "app/config/ncm_api_config.toml"
        
        # Atualiza o arquivo de configuração com o caminho do certificado
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
            
            # Configura a variável de ambiente para a senha
            os.environ["CERT_PASSWORD"] = cert_password
        
        # Inicializa o serviço de autenticação
        auth_service = NCMAuthService()
        
        # Executa a autenticação
        logger.info("Tentando autenticar com o Portal Único Siscomex...")
        
        # Marca o início da autenticação para medir o tempo
        start_time = datetime.datetime.now()
        
        try:
            # Realiza a autenticação
            tokens = auth_service.authenticate()
            
            # Calcula o tempo de autenticação
            elapsed_time = (datetime.datetime.now() - start_time).total_seconds()
            
            # Verifica se obteve os tokens
            if tokens and "jwt_token" in tokens and "csrf_token" in tokens:
                logger.info(f"Autenticação bem-sucedida! (tempo: {elapsed_time:.2f}s)")
                logger.info(f"Token JWT obtido (primeiros 30 caracteres): {tokens['jwt_token'][:30]}...")
                logger.info(f"Token CSRF obtido: {tokens['csrf_token']}")
                
                # Obtém a data de expiração
                expiry = tokens.get("expiry", "Desconhecida")
                logger.info(f"Data de expiração dos tokens: {expiry}")
                
                # Salva os tokens em arquivo para uso futuro
                output_file = "auth_tokens.json"
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump({
                        "jwt_token": tokens["jwt_token"],
                        "csrf_token": tokens["csrf_token"],
                        "expiry": expiry,
                        "generated_at": datetime.datetime.now().isoformat(),
                        "certificate": {
                            "path": cert_path,
                            "subject": cert_info.get("subject", "Desconhecido"),
                            "valid_until": str(cert_info.get("not_valid_after", "Desconhecido"))
                        }
                    }, f, indent=2)
                
                logger.info(f"Tokens salvos em: {output_file}")
                return True
            else:
                logger.error("Falha na autenticação: tokens não obtidos")
                return False
                
        except Exception as e:
            logger.error(f"Erro durante a autenticação: {str(e)}")
            return False
            
    except Exception as e:
        logger.error(f"Erro no teste de autenticação: {str(e)}")
        return False

def get_certificate_password(args_password: Optional[str] = None) -> str:
    """
    Obtém a senha do certificado digital.
    Tenta primeiro o valor passado como argumento, depois a variável de ambiente.
    
    Args:
        args_password: Senha do certificado passada como argumento
        
    Returns:
        str: Senha do certificado
    """
    if args_password:
        return args_password
    
    # Tenta obter da variável de ambiente
    env_password = os.environ.get("CERT_PASSWORD", "")
    if env_password:
        return env_password
        
    # Se não encontrou em nenhum lugar, solicita ao usuário
    from getpass import getpass
    return getpass("Digite a senha do certificado digital: ")

def parse_arguments():
    """
    Processa os argumentos de linha de comando.
    
    Returns:
        argparse.Namespace: Argumentos processados
    """
    parser = argparse.ArgumentParser(
        description="Teste de autenticação com certificado digital no Portal Único Siscomex"
    )
    
    parser.add_argument(
        "--cert", 
        type=str, 
        required=True,
        help="Caminho para o certificado digital (.pfx, .p12 ou .crt)"
    )
    
    parser.add_argument(
        "--cert-pass", 
        type=str, 
        help="Senha do certificado digital (ou use a variável de ambiente CERT_PASSWORD)"
    )
    
    return parser.parse_args()

async def main():
    """Função principal do script."""
    # Processa argumentos
    args = parse_arguments()
    
    # Verifica se o certificado existe
    if not os.path.exists(args.cert):
        logger.error(f"Certificado não encontrado: {args.cert}")
        return 1
    
    # Obtém a senha do certificado
    cert_password = get_certificate_password(args.cert_pass)
    
    # Testa a autenticação
    success = await test_auth(args.cert, cert_password)
    
    if success:
        logger.info("Teste de autenticação concluído com sucesso")
        return 0
    else:
        logger.error("Teste de autenticação falhou")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main())) 