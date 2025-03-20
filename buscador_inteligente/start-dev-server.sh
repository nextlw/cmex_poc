#!/bin/bash

# Definir variáveis de ambiente
export NODE_ENV=development
export MOCK_RESPONSES=true

# Verificar se a porta 3000 está em uso
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "Porta 3000 já está em uso. Usando porta 3000..."
    export PORT=3000
else
    echo "Usando porta padrão 3000..."
    export PORT=3000
fi

# Iniciar o servidor
echo "Iniciando servidor em modo de desenvolvimento com respostas mockadas..."
echo "Porta: $PORT"
echo "NODE_ENV: $NODE_ENV"
echo "MOCK_RESPONSES: $MOCK_RESPONSES"
echo "-------------------------------------------"

npm run server 