from dataclasses import dataclass, field
from typing import List

@dataclass
class ClassificacaoTributaria:
    monofasico: bool = False
    aliquota_zero: bool = False
    ipi_entrada: str = "não tributado"
    ipi_saida: str = "não tributado"
    pis_entrada: str = "não tributado"
    pis_saida: str = "não tributado"
    cofins_entrada: str = "não tributado"
    cofins_saida: str = "não tributado"
    cst_entrada: str = "sem CST"
    cst_saida: str = "sem CST"
    ncm: str = ""
    descricao: str = ""
    atributos: List[str] = field(default_factory=list)
    atributos_tipis: List[str] = field(default_factory=list)
