#!/bin/bash

# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Instalar Gunicorn
pip install gunicorn

# Criar Procfile
echo "web: uvicorn app.main:app --host 0.0.0.0 --port 8000" > Procfile