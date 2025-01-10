from pydantic import BaseModel, Field
from typing import List, Dict, Union

# MODELOS Pydantic
class ConsultaProduto(BaseModel):
    consulta: str = Field(..., min_length=3, description="Texto de busca do produto")
    estadoOrigem: Union[str, None] = None
    operacao: Union[str, None] = None
    regimeTributario: Union[str, None] = None
    tributacao: Union[str, None] = None
    reducaoOuIsencao: Union[str, None] = None


class ClassificacaoTributaria(BaseModel):
    monofasico: bool = Field(False, description="Indica se o produto é monofásico")
    aliquota_zero: bool = Field(False, description="Indica se o produto possui alíquota zero")
    ipi_entrada: Union[str, int, float] = Field("não tributado", description="Alíquota de IPI na entrada")
    ipi_saida: Union[str, int, float] = Field("não tributado", description="Alíquota de IPI na saída")
    pis_entrada: Union[str, int, float] = Field("não tributado", description="Alíquota de PIS na entrada")
    pis_saida: Union[str, int, float] = Field("não tributado", description="Alíquota de PIS na saída")
    cofins_entrada: Union[str, int, float] = Field("não tributado", description="Alíquota de COFINS na entrada")
    cofins_saida: Union[str, int, float] = Field("não tributado", description="Alíquota de COFINS na saída")
    cst_entrada: str = Field("sem CST", description="Código CST de entrada")
    cst_saida: str = Field("sem CST", description="Código CST de saída")

    def __init__(self, **data):
        # Converte valores numéricos para string com "não tributado" como padrão
        for field in ['ipi_entrada', 'ipi_saida', 'pis_entrada', 'pis_saida', 'cofins_entrada', 'cofins_saida']:
            if field in data:
                if data[field] in [0, 0.0]:
                    data[field] = "não tributado"
                elif not isinstance(data[field], str):
                    data[field] = str(data[field])
        super().__init__(**data)


class ValoresdeImpostos(BaseModel):
    ipi: Union[str, float] = "0%"
    icms: Dict[str, Union[str, float]] = {}
    pis: Union[str, float] = "1.65%"
    cofins: Union[str, float] = "7.6%"


class SugerirNCM(BaseModel):
    ncm: str = Field(..., description="Código NCM do produto")
    descricao: str = Field(..., description="Descrição do produto")
    atributos: List[str] = Field(default=[], description="Lista de atributos do produto")
    
    # Aqui usamos Field com default para caso o JSON venha sem "valores_de_impostos"
    valores_de_impostos: ValoresdeImpostos
    
    # Aqui usamos Field com validation_alias para caso o JSON venha como "atributos_tipi"
    atributos_tipi: List[str] = Field(default=[], validation_alias="atributos_tipi")
    
    classificacao_tributaria: ClassificacaoTributaria

    def to_frontend_format(self):
        """
        Monta o dicionário final no formato que o FRONT-END espera.
        Observe que, agora, mandamos "valores_de_impostos" ao invés de "aliquotas".
        """
        return {
            "ncm": self.ncm,
            "descricao": self.descricao,
            "atributos": self.atributos,
            "valores_de_impostos": {
                "ipi": self.valores_de_impostos.ipi,
                "icms": self.valores_de_impostos.icms,
                "pis": self.valores_de_impostos.pis,
                "cofins": self.valores_de_impostos.cofins
            },
            "atributos_tipi": self.atributos_tipi,
            "classificacao_tributaria": {
                "monofasico": self.classificacao_tributaria.monofasico,
                "aliquota_zero": self.classificacao_tributaria.aliquota_zero,
                "ipi_entrada": self.classificacao_tributaria.ipi_entrada,
                "ipi_saida": self.classificacao_tributaria.ipi_saida,
                "pis_entrada": self.classificacao_tributaria.pis_entrada,
                "pis_saida": self.classificacao_tributaria.pis_saida,
                "cofins_entrada": self.classificacao_tributaria.cofins_entrada,
                "cofins_saida": self.classificacao_tributaria.cofins_saida,
                "cst_entrada": self.classificacao_tributaria.cst_entrada,
                "cst_saida": self.classificacao_tributaria.cst_saida
            }
        }

    # Configurações para o Pydantic v2 (seu código já estava OK aqui)
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "examples": [
                {
                    "ncm": "12345678",
                    "descricao": "Descrição do produto de acordo com a ncm encontrada",
                    "atributos": [],
                    "valores_de_impostos": {
                        "ipi": "0%",
                        "icms": {},
                        "pis": "1.65%",
                        "cofins": "7.6%"
                    }
                }
            ]
        }
    }

