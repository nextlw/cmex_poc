# Estrutura de Rotas

Este diretório contém os routers e endpoints da API FastAPI do projeto CMEX.

## Organização das Rotas

A estrutura de rotas do projeto é organizada da seguinte forma:

### `/app/routes/`

Esta é a pasta principal para todos os routers da aplicação:

- `queries/`: Contém endpoints para consulta e classificação de produtos
  - `__init__.py`: Define o router principal e as funções de consulta
  - Arquivos específicos para cada modelo: `gpt.py`, `claude.py`, `gemini.py`, etc.
- `autocomplete/`: Contém endpoints para funcionalidade de autocompletar

## Convenção de Organização

1. **Router por funcionalidade**: Cada área funcional tem seu próprio router em um diretório dedicado.

2. **Ponto de entrada único**: Cada diretório de router tem um arquivo `__init__.py` que:

   - Define e exporta o router principal
   - Importa funções de outros arquivos conforme necessário

3. **Prefixo de URLs**:

   - Todas as rotas usam o prefixo `/api/v1/`
   - Cada router tem seu próprio prefixo adicional (ex: `/api/v1/queries/`)

4. **Responsabilidades separadas**:
   - Arquivos de modelo (`gpt.py`, etc.) contêm lógica específica do modelo
   - Arquivo principal (`__init__.py`) contém a lógica de roteamento e APIs

## Exemplo de Router

```python
# Criar um router
from fastapi import APIRouter
queries_router = APIRouter()

# Adicionar endpoints ao router
@queries_router.post("/queries")
async def create_query(request: Request):
    # Lógica do endpoint
    return {"result": "success"}

# Em app/main.py - Incluir o router na aplicação
app.include_router(queries_router, prefix=SETTINGS.API_V1_STR)
```

## Diretrizes Importantes

1. **NÃO use o diretório `/routers/`**: Toda a lógica de roteamento deve estar em `/app/routes/`.

2. **Nomenclatura consistente**: Use nomes claros e descritivos para endpoints.

3. **Documentação de API**: Todos os endpoints devem incluir docstrings explicando seu propósito e parâmetros.

4. **Validação de dados**: Use Pydantic models (schemas) para validar dados de entrada e saída.

5. **Gerenciamento de exceções**: Use try/except para capturar e tratar erros adequadamente.
