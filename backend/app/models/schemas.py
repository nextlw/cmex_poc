from pydantic import BaseModel, Field
from typing import List, Dict, Union, Optional

# MODELOS Pydantic
class ConsultaProduto(BaseModel):
    consulta: str = Field(..., min_length=3, description="Texto de busca do produto")
    modelo: str = Field(..., description="Modelo que será usado para gerar uma Sugestão de Produto.")
    estadoOrigem: Union[str, None] = None
    operacao: Union[str, None] = None
    regimeTributario: Union[str, None] = None
    tributacao: Union[str, None] = None
    reducaoOuIsencao: Union[str, None] = None


class TipoTributario(BaseModel):
    monofasico: bool = False
    aliquota_zero: bool = False
    isento: bool = False
    suspenso: bool = False


class ClassificacaoTributaria(BaseModel):
    tipo_tributario: TipoTributario
    ipi_entrada: str = ""
    ipi_saida: str = ""
    pis_entrada: str = ""
    pis_saida: str = ""
    cofins_entrada: str = ""
    cofins_saida: str = ""
    cst_entrada: str = ""
    cst_saida: str = ""


class ValoresdeImpostos(BaseModel):
    ipi: str
    icms: Dict[str, str]
    pis: str
    cofins: str


class SugerirNCM(BaseModel):
    ncm: str
    descricao: str
    atributos: List[str]
    atributos_tipi: List[str]
    valores_de_impostos: ValoresdeImpostos
    classificacao_tributaria: ClassificacaoTributaria

    def to_frontend_format(self):
        """Converte o modelo para o formato esperado pelo frontend."""
        classificacao = self.classificacao_tributaria.model_dump()
        tipo_tributario = classificacao.pop("tipo_tributario")
        
        return {
            "ncm": self.ncm,
            "descricao": self.descricao,
            "atributos": self.atributos,
            "atributos_tipi": self.atributos_tipi,
            "valores_de_impostos": self.valores_de_impostos.model_dump(),
            "classificacao_tributaria": {
                **classificacao,
                "tipo_tributario": tipo_tributario
            }
        }

    # Configurações para o Pydantic v2
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "examples": [
                {
                    "ncm": "12345678",
                    "descricao": "Descrição do produto de acordo com a ncm encontrada",
                    "atributos": [],
                    "atributos_tipi": [],
                    "valores_de_impostos": {
                        "ipi": "0%",
                        "icms": {},
                        "pis": "1.65%",
                        "cofins": "7.6%"
                    },
                    "classificacao_tributaria": {
                        "tipo_tributario": {
                            "monofasico": True,
                            "aliquota_zero": False,
                            "isento": False,
                            "suspenso": False
                        },
                        "ipi_entrada": "0%",
                        "ipi_saida": "0%",
                        "pis_entrada": "1.65%",
                        "pis_saida": "1.65%",
                        "cofins_entrada": "7.6%",
                        "cofins_saida": "7.6%",
                        "cst_entrada": "01",
                        "cst_saida": "01"
                    }
                }
            ]
        }
    }

