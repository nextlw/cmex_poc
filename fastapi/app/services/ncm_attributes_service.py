import json
import logging
from typing import Dict, List, Optional
from fastapi import HTTPException
from pathlib import Path

logger = logging.getLogger(__name__)


class NCMAttributesService:
    """Serviço para gerenciar atributos de NCM."""

    _attributes_data: Dict = {}

    @classmethod
    async def load_attributes_data(cls) -> None:
        """Carrega os dados de atributos do arquivo JSON no startup."""
        try:
            file_path = (
                Path(__file__).parent.parent
                / "schemas"
                / "atributos"
                / "atributos.json"
            )

            if not file_path.exists():
                logger.warning(f"Arquivo de atributos não encontrado: {file_path}")
                return

            with open(file_path, "r", encoding="utf-8") as f:
                cls._attributes_data = json.load(f)

            logger.info(
                f"Dados de atributos NCM carregados com sucesso: {len(cls._attributes_data)} entradas"
            )
        except Exception as e:
            logger.error(f"Erro ao carregar dados de atributos NCM: {str(e)}")

    @classmethod
    def get_attributes_for_ncm(cls, ncm_code: str) -> List[Dict]:
        """
        Obtém os atributos para um código NCM específico.

        Args:
            ncm_code: Código NCM de 8 dígitos

        Returns:
            Lista de dicionários de atributos para o NCM
        """
        if not cls._attributes_data:
            logger.warning("Dados de atributos não foram carregados")
            return []

        # Verifica se o formato do NCM é válido
        if not (
            isinstance(ncm_code, str) and len(ncm_code) == 8 and ncm_code.isdigit()
        ):
            logger.warning(f"Código NCM inválido: {ncm_code}")
            return []

        # Implementar lógica para encontrar atributos do NCM
        # Esta é uma implementação básica, pode precisar ser adaptada de acordo
        # com a estrutura real do seu arquivo JSON
        attributes = []

        if "itens" in cls._attributes_data:
            # Supondo que os atributos estão organizados por NCM no arquivo
            ncm_attributes = cls._attributes_data.get("itens", {}).get(ncm_code, [])

            if ncm_attributes:
                attributes.extend(ncm_attributes)
            else:
                logger.info(f"Nenhum atributo encontrado para NCM: {ncm_code}")

        return attributes


# Função para registrar no startup da aplicação
async def load_attributes_on_startup():
    """Função para carregar dados de atributos no startup da aplicação."""
    await NCMAttributesService.load_attributes_data()
