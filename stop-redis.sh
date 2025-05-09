#!/bin/bash

echo "=== Parando Redis CMEX na porta 6378 ==="

# Verifica se existe um processo Redis rodando na porta 6378
REDIS_PID=$(pgrep -f "redis-server.*:6378")
if [ -z "$REDIS_PID" ]; then
    echo "🤔 Nenhum servidor Redis encontrado rodando na porta 6378"
    exit 0
fi

# Tenta parar o Redis de forma elegante primeiro
echo "🛑 Parando Redis (PID: $REDIS_PID)..."
redis-cli -p 6378 shutdown

# Aguarda um pouco para o Redis parar
sleep 2

# Verifica se o Redis ainda está rodando
if pgrep -f "redis-server.*:6378" > /dev/null; then
    echo "⚠️ Redis ainda está rodando. Forçando encerramento..."
    kill -9 $REDIS_PID
    echo "💥 Redis encerrado forçadamente"
else
    echo "✅ Redis parado com sucesso"
fi

# Remove o arquivo de PID caso ainda exista
if [ -f "/Users/williamduarte/NCMproduto/cmex_poc/redis_6378.pid" ]; then
    rm /Users/williamduarte/NCMproduto/cmex_poc/redis_6378.pid
fi
