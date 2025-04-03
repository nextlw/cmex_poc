from fastapi import APIRouter, HTTPException, Path, Depends
from typing import List, Dict, Any
import logging

from app.models.ncm_attribute_schemas import AtributoNCM
from app.services.ncm_attributes_service import NCMAttributesService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/ncm",
    tags=["ncm-attributes"],
    responses={404: {"description": "Atributos não encontrados"}},
)


@router.get("/{ncm_code}/attributes", response_model=List[AtributoNCM])
async def get_ncm_attributes(
    ncm_code: str = Path(..., description="Código NCM de 8 dígitos")
):
    """
    Retorna os atributos para um código NCM específico.

    - **ncm_code**: Código NCM de 8 dígitos
    """
    # Validação básica do NCM
    if not (len(ncm_code) == 8 and ncm_code.isdigit()):
        raise HTTPException(
            status_code=400,
            detail=f"Código NCM inválido: {ncm_code}. Deve ter 8 dígitos numéricos.",
        )

    # Obter atributos do serviço
    attributes_data = NCMAttributesService.get_attributes_for_ncm(ncm_code)

    if not attributes_data:
        logger.info(f"Nenhum atributo encontrado para NCM: {ncm_code}")
        return []

    # Validar cada atributo contra o schema
    validated_attributes = []

    for attr_dict in attributes_data:
        try:
            # Tenta validar com o schema
            attribute = AtributoNCM.parse_obj(attr_dict)
            validated_attributes.append(attribute)
        except Exception as e:
            # Log de erro e continua com o próximo
            logger.warning(f"Erro ao validar atributo para NCM {ncm_code}: {str(e)}")
            continue

    return validated_attributes
