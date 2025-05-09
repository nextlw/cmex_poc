#!/bin/bash

echo "=== Iniciando Redis para CMEX na porta 6378 ==="

# Verifica se já existe um processo Redis rodando na porta 6378
REDIS_PID=$(pgrep -f "redis-server.*:6378")
if [ ! -z "$REDIS_PID" ]; then
    echo "🚫 Redis já está rodando na porta 6378 (PID: $REDIS_PID)"
    echo "✅ Tudo certo! Redis já está disponível na porta 6378"
    exit 0
fi

# Inicia o Redis com as configurações personalizadas
redis-server /Users/williamduarte/NCMproduto/cmex_poc/redis.conf

# Aguarda um pouco para o Redis iniciar
sleep 1

# Verifica se o Redis iniciou corretamente
if redis-cli -p 6378 ping | grep -q "PONG"; then
    echo "✅ Redis iniciado com sucesso na porta 6378"
    echo "📊 Informações do Redis:"
    redis-cli -p 6378 info | grep redis_version
    redis-cli -p 6378 info | grep used_memory_human
    echo "🔗 Conexão: redis://localhost:6378"
else
    echo "⚠️ Houve um problema ao iniciar o Redis. Verifique os logs em redis_6378.log"
fi
