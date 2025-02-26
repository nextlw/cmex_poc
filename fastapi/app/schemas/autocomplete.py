# Bibliotecas
from pydantic import BaseModel, Field

# Tipagem
class ConsultaAutocomplete(BaseModel):
    consulta: str = Field(..., min_length=3, description="Texto de busca do produto")
