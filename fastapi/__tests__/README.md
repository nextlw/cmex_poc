# Testes Automatizados

Este diretório contém todos os testes automatizados do projeto FastAPI CMEX.

## Estrutura de Testes

```
__tests__/
├── data/               # Dados de entrada para testes
├── results/            # Resultados e logs de testes
├── test_ncm_validation_real.py    # Testes funcionais para validação de NCM
├── test_ncm_validation_perf.py    # Testes de performance para validação de NCM
├── test_sse.py                    # Testes para Server-Sent Events
├── test_sse_client.py             # Testes para cliente SSE
├── test_sse_simple.py             # Testes simplificados para SSE
├── integration_test.py            # Testes de integração
├── redis_test.py                  # Testes para integração com Redis
└── frontend_integration_test.py   # Testes de integração com frontend
```

## Categorias de Testes

1. **Testes Funcionais**: Verificam se as funcionalidades estão corretas

   - `test_ncm_validation_real.py`

2. **Testes de Performance**: Medem o desempenho sob diferentes cargas

   - `test_ncm_validation_perf.py`

3. **Testes de Integração**: Verificam a integração entre componentes

   - `integration_test.py`
   - `frontend_integration_test.py`

4. **Testes de Comunicação**: Verificam o funcionamento de SSE e Redis
   - `test_sse.py`, `test_sse_client.py`, `test_sse_simple.py`
   - `redis_test.py`

## Executando Testes

### Executar todos os testes

```bash
pytest
```

### Executar uma categoria específica

```bash
# Testes de validação de NCM
pytest test_ncm_validation_real.py

# Testes de performance
pytest test_ncm_validation_perf.py

# Testes de SSE
pytest test_sse*.py
```

### Executar com opções específicas

```bash
# Mostrar saída detalhada
pytest -v

# Mostrar cobertura de código
pytest --cov=app

# Gerar relatório de cobertura HTML
pytest --cov=app --cov-report=html
```

## Dicas para Novos Testes

1. **Nomeie os arquivos corretamente**: Use o prefixo `test_` para todos os arquivos de teste.

2. **Organize em categorias**: Mantenha a organização por categoria funcional.

3. **Use fixtures**: Compartilhe configuração entre testes usando fixtures do pytest.

4. **Documente os testes**: Cada função de teste deve ter uma docstring explicando o que está sendo testado.

5. **Mantenha isolamento**: Evite dependências entre testes para garantir que possam ser executados em qualquer ordem.
