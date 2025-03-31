# API FastAPI CMEX

API REST para consulta e classificação de NCM utilizando diferentes modelos de IA.

## Estrutura do Projeto

```
fastapi/
├── app/                  # Aplicação principal
│   ├── models/           # Modelos de domínio
│   ├── routes/           # Rotas/endpoints da API
│   │   ├── queries/      # Endpoints de consulta
│   │   └── autocomplete/ # Endpoints de autocompletar
│   ├── schemas/          # Schemas/DTOs específicos de API
│   ├── services/         # Serviços e lógica de negócio
│   ├── middlewares/      # Middlewares personalizados
│   ├── exceptions/       # Manipuladores de exceção
│   ├── config.py         # Configurações da aplicação
│   └── main.py           # Ponto de entrada da aplicação
├── __tests__/            # Testes automatizados
│   ├── data/             # Dados de teste
│   └── results/          # Resultados de testes
├── venv/                 # Ambiente virtual Python
├── main.py               # Proxy para app/main.py
├── requirements.txt      # Dependências Python
└── .env                  # Variáveis de ambiente
```

## Convenções de Organização

1. **Estrutura de Módulos**:

   - `app/routes/`: Todas as rotas da API
   - `app/schemas/`: Schemas específicos de API
   - `app/models/`: Schemas de domínio

2. **Hierarquia de Importação**:
   - Evite importações circulares
   - Importe do módulo mais específico possível

## Executando o Projeto

1. Configure o ambiente virtual:

   ```bash
   python -m venv venv
   source venv/bin/activate  # No Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env
   # Edite o arquivo .env conforme necessário
   ```

3. Execute o servidor:

   ```bash
   python -m uvicorn app.main:app --reload --port 10000
   ```

4. Acesse a documentação Swagger:
   ```
   http://localhost:10000/api/docs
   ```

## Rotas Principais

- `GET /api/queries`: Lista todas as consultas realizadas
- `POST /api/queries`: Cria uma nova consulta
- `GET /api/queries/{id}`: Obtém detalhes de uma consulta específica
- `POST /api/query`: Processa consulta com modelo específico

## Executando Testes

```bash
# Executar todos os testes
pytest __tests__/

# Executar testes específicos
pytest __tests__/test_ncm_validation_real.py
```

## Boas Práticas

1. **Schemas**:

   - Use schemas Pydantic para validação de dados
   - Documente todos os campos com descrições claras

2. **Rotas**:

   - Organize rotas por funcionalidade
   - Use prefixos consistentes
   - Documente endpoints com descrições e exemplos

3. **Código**:
   - Siga PEP 8 para estilo de código Python
   - Use tipagem estática sempre que possível
   - Documente funções e classes com docstrings

```

```
