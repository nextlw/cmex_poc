from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import date
from enum import Enum


class DominioItem(BaseModel):
    """Representa um item de domínio de um atributo."""

    codigo: str
    descricao: str


class Objetivo(BaseModel):
    """Representa um objetivo de um atributo."""

    codigo: Union[str, int]
    descricao: str


class FormaPreenchimentoEnum(str, Enum):
    """Enumeração das possíveis formas de preenchimento."""

    TEXTO = "TEXTO"
    NUMERO_INTEIRO = "NUMERO_INTEIRO"
    NUMERO_REAL = "NUMERO_REAL"
    BOOLEANO = "BOOLEANO"
    DATA = "DATA"
    LISTA_ESTATICA = "LISTA_ESTATICA"
    LISTA_DINAMICA = "LISTA_DINAMICA"
    DATA_HORA = "DATA_HORA"
    DOMINIO_DINAMICO = "DOMINIO_DINAMICO"
    COMPOSTO = "COMPOSTO"
    LISTA_TABX_FILTRO = "LISTA_TABX_FILTRO"


class ModalidadeEnum(str, Enum):
    """Enumeração das possíveis modalidades."""

    IMPORTACAO = "IMPORTACAO"
    EXPORTACAO = "EXPORTACAO"
    AMBOS = "AMBOS"


class OperadorEnum(str, Enum):
    """Enumeração dos possíveis operadores para condições."""

    IGUAL = "IGUAL"
    DIFERENTE = "DIFERENTE"
    MAIOR = "MAIOR"
    MENOR = "MENOR"
    MAIOR_IGUAL = "MAIOR_IGUAL"
    MENOR_IGUAL = "MENOR_IGUAL"
    EM = "EM"
    NAO_EM = "NAO_EM"


class ComposicaoEnum(str, Enum):
    """Enumeração de tipos de composição de condições."""

    E = "E"
    OU = "OU"


class Condicao(BaseModel):
    """Representa uma condição para um atributo condicionado."""

    operador: Union[OperadorEnum, str]
    valor: Any
    composicao: Optional[Union[ComposicaoEnum, str]] = None
    condicao: Optional["Condicao"] = None


class AtributoNCM(BaseModel):
    """Modelo base para atributos de NCM."""

    codigo: str = Field(..., description="Código único do atributo")
    nome: Optional[str] = Field(None, description="Nome técnico do atributo")
    nomeApresentacao: str = Field(..., description="Nome exibido ao usuário")
    definicao: Optional[str] = Field(
        None, description="Descrição/definição do atributo"
    )
    formaPreenchimento: FormaPreenchimentoEnum = Field(
        ..., description="Como o atributo deve ser preenchido"
    )
    modalidade: ModalidadeEnum = Field(
        ..., description="Se aplica a Importação, Exportação ou Ambos"
    )
    obrigatorio: bool = Field(
        ..., description="Se o preenchimento do atributo é obrigatório"
    )
    dataInicioVigencia: date = Field(
        ..., description="Data de início da validade do atributo"
    )
    dataFimVigencia: Optional[date] = Field(
        None, description="Data de fim da validade do atributo"
    )

    # Campos opcionais baseados na spec
    tipoAtributo: Optional[str] = None
    brid: Optional[str] = None
    wcoid: Optional[str] = None
    orientacaoPreenchimento: Optional[str] = None
    tamanhoMaximo: Optional[int] = None
    mascara: Optional[str] = None
    casasDecimais: Optional[int] = None
    informacaoAdicional: Optional[str] = None
    dominio: Optional[List[DominioItem]] = Field(
        None, description="Lista de valores possíveis (para listas estáticas)"
    )
    atributoFiltro: Optional["AtributoNCM"] = None  # Auto-referência para filtro
    objetivos: Optional[List[Objetivo]] = Field(
        None, description="Objetivos do atributo (Produto, TA, etc.)"
    )
    orgaos: Optional[List[str]] = Field(
        None, description="Órgãos anuentes responsáveis"
    )
    atributoCondicionante: bool = Field(
        False, description="Indica se este atributo tem outros que dependem dele"
    )
    condicionados: Optional[List["AtributoCondicionado"]] = Field(
        None, description="Atributos que dependem deste"
    )
    listaSubatributos: Optional[List["AtributoNCM"]] = Field(
        None, description="Subatributos (para atributos compostos)"
    )
    multivalorado: bool = Field(
        False, description="Se o atributo pode ter múltiplos valores"
    )

    class Config:
        use_enum_values = True
        anystr_strip_whitespace = True
        validate_assignment = True
        orm_mode = True


class AtributoCondicionadoDetalhe(BaseModel):
    """Detalhe de um atributo condicionado."""

    atributo: AtributoNCM


class AtributoCondicionado(BaseModel):
    """Representa um atributo condicionado."""

    obrigatorio: bool
    multivalorado: bool
    dataInicioVigencia: date
    dataFimVigencia: Optional[date] = None
    descricaoCondicao: Optional[str] = None
    condicao: Condicao
    atributo: AtributoNCM


# Atualização recursiva dos modelos
AtributoNCM.update_forward_refs()
Condicao.update_forward_refs()
AtributoCondicionado.update_forward_refs()


# --- Outros Schemas (se necessário para outras partes da API) ---
class AtributoNcmResponse(BaseModel):
    codigoNcm: str
    listaAtributos: List[AtributoNCM]
