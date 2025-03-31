#!/bin/bash

# Definir variáveis de ambiente
export NODE_ENV=development
export MOCK_RESPONSES=true

# Verificar portas em uso
echo "Verificando portas disponíveis..."
PORTS=(3001)
SELECTED_PORT=""

for PORT in "${PORTS[@]}"; do
  if ! lsof -i:$PORT > /dev/null 2>&1; then
    SELECTED_PORT=$PORT
    echo "Porta $PORT está disponível."
    break
  else
    echo "Porta $PORT está em uso."
  fi
done

if [ -z "$SELECTED_PORT" ]; then
  echo "Todas as portas estão em uso. Usando porta 3999."
  SELECTED_PORT=3999
fi

# Iniciar o servidor
echo "Iniciando servidor em modo de desenvolvimento com respostas mockadas..."
echo "Porta: $SELECTED_PORT"
echo "NODE_ENV: $NODE_ENV"
echo "MOCK_RESPONSES: $MOCK_RESPONSES"
echo "-------------------------------------------"

export PORT=$SELECTED_PORT
npm run server 