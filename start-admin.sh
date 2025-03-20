#!/bin/bash

echo "=== Iniciando Painel Administrativo CMEX ==="
echo "Iniciando o painel administrativo..."

cd /Users/williamduarte/Pesquisa_CMEX/cmex_poc/admin-panel-next

# Carrega variáveis de ambiente do arquivo .env
source /Users/williamduarte/Pesquisa_CMEX/cmex_poc/.env

# Define valores padrão se não estiverem no .env
REDIS_PORT=${REDIS_PORT:-6378}
FASTAPI_PORT=${FASTAPI_PORT:-10000}
NODE_PORT=${NODE_PORT:-3000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
ADMIN_PANEL_PORT=${ADMIN_PANEL_PORT:-3003}

# Inicia o Next.js em background e redireciona outputs para evitar bloqueio
nohup pnpm run dev > /dev/null 2>&1 &

# Espera um pouco para o servidor iniciar
echo "⏳ Aguardando o servidor iniciar..."
sleep 3

# Abre o navegador na URL correta
open http://localhost:${ADMIN_PANEL_PORT}

echo "✅ Painel administrativo iniciado em http://localhost:${ADMIN_PANEL_PORT}"
echo "📊 As portas configuradas para os serviços são:"
echo "   - Redis: ${REDIS_PORT}"
echo "   - FastAPI: ${FASTAPI_PORT}"
echo "   - Node: ${NODE_PORT}"
echo "   - Frontend: ${FRONTEND_PORT}"
echo "   - Admin Panel: ${ADMIN_PANEL_PORT}"

# Script termina aqui, sem esperar pelo processo em background
