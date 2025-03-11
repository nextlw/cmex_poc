#!/bin/bash

# Script para executar todos os geradores de documentação

# Definir diretório principal
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVIDENCE_DIR="${DIR}/../../test-reports/evidence"

# Criar diretórios necessários
mkdir -p "$EVIDENCE_DIR"
mkdir -p "$EVIDENCE_DIR/screenshots"

# Registrar início da execução
echo "Iniciando geração de documentação em $(date)"
echo "==============================================="

# Executar script de documentação do fluxo SSE
echo "Gerando documentação do fluxo SSE..."
node "$DIR/document_sse_flow.js"
if [ $? -eq 0 ]; then
    echo "✓ Documentação do fluxo SSE gerada com sucesso."
else
    echo "✗ Falha ao gerar documentação do fluxo SSE."
fi
echo "-----------------------------------------------"

# Executar script de simulação de testes do ChatMessage
echo "Gerando documentação de testes do ChatMessage..."
node "$DIR/simulate_chat_message_tests.js"
if [ $? -eq 0 ]; then
    echo "✓ Documentação de testes do ChatMessage gerada com sucesso."
else
    echo "✗ Falha ao gerar documentação de testes do ChatMessage."
fi
echo "-----------------------------------------------"

# Executar script de geração do relatório final
echo "Gerando relatório final consolidado..."
node "$DIR/generate_final_report.js"
if [ $? -eq 0 ]; then
    echo "✓ Relatório final gerado com sucesso."
else
    echo "✗ Falha ao gerar relatório final."
fi
echo "-----------------------------------------------"

# Listar arquivos gerados
echo "Arquivos de documentação gerados:"
find "$EVIDENCE_DIR" -type f -name "*.md" | sort

# Exibir mensagem final
echo "==============================================="
echo "Geração de documentação concluída em $(date)"
echo "Os relatórios estão disponíveis em: $EVIDENCE_DIR" 