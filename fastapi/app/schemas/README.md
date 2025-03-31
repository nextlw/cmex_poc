# Estrutura de Schemas

Este diretório contém os schemas (modelos de dados) usados na API FastAPI do projeto CMEX.

## Organização dos Schemas

A estrutura de schemas do projeto é dividida da seguinte forma:

### `/app/schemas/`

Esta pasta contém schemas relacionados a operações de API específicas:

- `autocomplete.py`: Schemas para operações de autocompletar
- `pesquisas.py`: Schemas para registro e busca de histórico de pesquisas
- `ncm_validation.py`: Schemas para validação técnica de classificações NCM

### `/app/models/`

Esta pasta contém schemas de domínio mais gerais:

- `schemas.py`: Schema base para consulta de produtos
- `error.py`: Schemas para formatação de erros

## Convenção de Nomeação

- Use `PascalCase` para nomes de classes (ex: `ValidationRequest`)
- Use `snake_case` para nomes de atributos (ex: `relevant_results`)

## Exemplo de Uso

```python
from app.schemas.ncm_validation import ValidationRequest
from app.models.schemas import ConsultaProduto

# Criar uma consulta de produto
consulta = ConsultaProduto(
    consulta="Camisa polo masculina",
    modelo="Gemini",
    useDeepResearch=True
)

# Usar em uma rota
@app.post("/api/product", response_model=Product)
def create_product(consulta: ConsultaProduto):
    # Processar consulta
    return result
```

## Documentação

Todos os schemas devem incluir docstrings explicando seu propósito e atributos:

```python
class ExampleSchema(BaseModel):
    """
    Descrição do schema.

    Attributes:
        campo1: Descrição do campo1
        campo2: Descrição do campo2
    """
    campo1: str
    campo2: int
```
