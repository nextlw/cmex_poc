#!/bin/bash

echo "=== Iniciando Painel Administrativo CMEX ==="
echo "Iniciando o painel administrativo..."

cd /Users/williamduarte/Pesquisa_CMEX/cmex_poc/admin-panel-next

# Inicia o Next.js em background e redireciona outputs para evitar bloqueio
nohup pnpm run dev > /dev/null 2>&1 &

# Espera um pouco para o servidor iniciar
echo "⏳ Aguardando o servidor iniciar..."
sleep 3

# Abre o navegador na URL correta
open http://localhost:3003

echo "✅ Painel administrativo iniciado em http://localhost:3003"
echo "📊 As portas configuradas para os serviços são:"
echo "   - Redis: 6378"
echo "   - FastAPI: 10000"
echo "   - Node: 3000"
echo "   - Frontend: 5173"

# Script termina aqui, sem esperar pelo processo em background
