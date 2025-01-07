#!/bin/bash

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt

# Instalar Gunicorn
pip install gunicorn

# Para llama-cpp-python:
pip install llama-cpp-python

# OU para usar via Hugging Face:
pip install transformers torch

# Criar Procfile
echo "web: uvicorn app.main:app --host 0.0.0.0 --port 8000" > Procfile