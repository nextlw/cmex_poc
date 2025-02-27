from pydantic import BaseModel, Field
from typing import Union

# MODELOS Pydantic
class ConsultaProduto(BaseModel):
    consulta: str = Field(..., min_length=3, description="Texto de busca do produto")
    modelo: str = Field(..., description="Modelo que será usado para gerar uma Sugestão de Produto.")
    autocomplete: bool = False
    useDeepResearch: bool = False
    estadoOrigem: Union[str, None] = "Não informado"
    operacao: Union[str, None] = None
    regimeTributario: Union[str, None] = None
    tributacao: Union[str, None] = None

