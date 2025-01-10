# Bibliotecas
from pydantic import BaseModel, Field
from typing import List

# Tipagem
class SugestaoProduto(BaseModel):
    ncm: str = Field(..., description="Código NCM do produto")
    description: str = Field(..., description="Descrição do produto")
    attributes: List[str] = Field(default=[], description="Lista de atributos do produto")
    tax_rates: dict = Field(
        default={
            "ipi": "0%",
            "icms": {},
            "pis": "1.65%",
            "cofins": "7.6%"
        },
        description="Alíquotas tributárias do produto"
    )
    tipi_attributes: List[str] = Field(
        default=[],
        description="Atributos específicos da TIPI"
    )