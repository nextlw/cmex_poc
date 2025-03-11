#!/bin/bash

# Script para executar o teste real de conversa com IA

# Definir diretório principal
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$DIR/../.." && pwd)"
EVIDENCE_DIR="${BASE_DIR}/test-reports/evidence/real-tests"
LOG_FILE="${EVIDENCE_DIR}/execution-$(date +%Y-%m-%d_%H-%M-%S).log"

# Criar diretórios necessários
mkdir -p "$EVIDENCE_DIR"
mkdir -p "$EVIDENCE_DIR/screenshots"

# Função para registrar mensagens no log
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# Registrar início da execução
log "=== Iniciando teste real de conversa com IA ==="
log "Diretório base: $BASE_DIR"

# Verificar o comando para iniciar o servidor
log "Verificando comandos disponíveis no package.json..."
AVAILABLE_SCRIPTS=$(cd "$BASE_DIR" && pnpm run 2>&1 | grep -B1 "Lifecycle scripts" | grep -A100 "available via" | grep -v "Lifecycle scripts" | grep -v "available via" | grep -v "^$" | awk '{print $1}')

if echo "$AVAILABLE_SCRIPTS" | grep -q "dev"; then
  START_COMMAND="pnpm run dev"
elif echo "$AVAILABLE_SCRIPTS" | grep -q "start"; then
  START_COMMAND="pnpm run start"
elif echo "$AVAILABLE_SCRIPTS" | grep -q "serve"; then
  START_COMMAND="pnpm run serve"
else
  log "AVISO: Não foi possível determinar o comando para iniciar o servidor. Assumindo que já está em execução."
  START_COMMAND=""
fi

# Verificar se o frontend está rodando
log "Verificando se o frontend está rodando..."
if ! curl -s http://localhost:5173 > /dev/null; then
  if [ -n "$START_COMMAND" ]; then
    log "Frontend não está rodando. Iniciando com '$START_COMMAND'..."
    # Iniciar em segundo plano
    cd "$BASE_DIR" && eval "$START_COMMAND &" 
    SERVER_PID=$!
    log "Servidor iniciado com PID $SERVER_PID. Aguardando inicialização..."
    
    # Esperar até 30 segundos para o servidor iniciar
    WAIT_COUNT=0
    while ! curl -s http://localhost:5173 > /dev/null && [ $WAIT_COUNT -lt 30 ]; do
      sleep 1
      WAIT_COUNT=$((WAIT_COUNT + 1))
      echo -n "."
    done
    echo ""
    
    if curl -s http://localhost:5173 > /dev/null; then
      log "Frontend iniciado com sucesso após $WAIT_COUNT segundos."
    else
      log "ERRO: Não foi possível iniciar o frontend após 30 segundos de espera."
      log "Verifique os logs do servidor ou inicie-o manualmente com '$START_COMMAND'."
      exit 1
    fi
  else
    log "ERRO: O frontend não está rodando na porta 5173. Inicie-o manualmente antes de executar este teste."
    exit 1
  fi
else
  log "Frontend detectado em execução."
fi

# Instalar puppeteer se necessário
if ! pnpm list puppeteer | grep -q puppeteer; then
  log "Instalando puppeteer..."
  cd "$BASE_DIR" && pnpm install --save-dev puppeteer
  pnpm approve-builds puppeteer
fi

# Criar um diretório temporário para o teste
TEST_DIR="${BASE_DIR}/test-reports/temp"
mkdir -p "$TEST_DIR"

# Copiar o arquivo de teste para um local temporário e ajustar para Jest
log "Preparando ambiente de teste..."
cp "${DIR}/e2e/chat_conversation.test.js" "${TEST_DIR}/chat_conversation.test.js"

# Criar arquivo de configuração do Jest para o teste
cat > "${TEST_DIR}/jest.config.js" << EOF
module.exports = {
  testEnvironment: 'node',
  testTimeout: 300000, // 5 minutos
  verbose: true,
};
EOF

# Executar o teste
log "Executando teste de conversa... (pode levar até 5 minutos)"
cd "$BASE_DIR" && pnpm exec jest "${TEST_DIR}/chat_conversation.test.js" --config="${TEST_DIR}/jest.config.js" --runInBand --verbose 2>&1 | tee -a "$LOG_FILE"

TEST_RESULT=$?

# Mover screenshots para o diretório de evidências
if ls /Users/williamduarte/Pesquisa_CMEX/cmex_poc/test-reports/evidence/real-tests/*.png 1> /dev/null 2>&1; then
  log "Movendo screenshots do caminho absoluto para o diretório de evidências..."
  mv /Users/williamduarte/Pesquisa_CMEX/cmex_poc/test-reports/evidence/real-tests/*.png "$EVIDENCE_DIR/screenshots/" 2>/dev/null || true
fi

# Gerar relatório de resumo
SUMMARY_FILE="${EVIDENCE_DIR}/resumo-teste-$(date +%Y-%m-%d_%H-%M-%S).md"

# Listar screenshots
SCREENSHOT_LIST=""
if [ -d "$EVIDENCE_DIR/screenshots" ]; then
  SCREENSHOT_LIST=$(ls -1 "$EVIDENCE_DIR/screenshots" 2>/dev/null | sort)
fi

cat > "$SUMMARY_FILE" << EOF
# Resumo do Teste Real de Conversa com IA

**Data de Execução**: $(date "+%d/%m/%Y %H:%M:%S")

## Objetivo do Teste

Verificar se o frontend é capaz de:
1. Enviar uma mensagem "olá" para o backend
2. Receber e exibir corretamente os dados retornados via SSE, incluindo:
   - A seção de pensamento (thinking)
   - A resposta do modelo
   - O indicador de modelo
   - As referências (se houver)

## Resultado

**Status**: $([ $TEST_RESULT -eq 0 ] && echo "✅ PASSOU" || echo "❌ FALHOU")

## Evidências

Os seguintes artefatos foram gerados:
- Screenshots do teste: \`$EVIDENCE_DIR/screenshots/*.png\`
- Logs da execução: \`$LOG_FILE\`

### Screenshots Capturados

$(if [ -n "$SCREENSHOT_LIST" ]; then
  echo "Os seguintes screenshots foram capturados durante o teste:"
  echo ""
  for screenshot in $SCREENSHOT_LIST; do
    echo "- \`$screenshot\`"
  done
else
  echo "Nenhum screenshot foi capturado durante o teste."
fi)

## Próximos Passos

$([ $TEST_RESULT -eq 0 ] && echo "- Documentar o sucesso do teste na documentação do projeto
- Considerar a adição de mais testes para cobrir outros cenários" || echo "- Analisar os logs e screenshots para identificar o motivo da falha
- Corrigir os problemas identificados
- Executar o teste novamente")

## Observações

Este teste valida o fluxo completo de comunicação entre o frontend e o backend, 
garantindo que os componentes de UI estão corretamente integrados com o sistema SSE.
EOF

log "Resumo do teste gerado em: $SUMMARY_FILE"

# Finalizar servidor se tiver sido iniciado pelo script
if [ -n "$SERVER_PID" ]; then
  log "Finalizando servidor (PID $SERVER_PID)..."
  kill $SERVER_PID 2>/dev/null || true
fi

# Exibir o caminho para as evidências
log "=== Teste concluído (status: $TEST_RESULT) ==="
log "Evidências disponíveis em: $EVIDENCE_DIR"

exit $TEST_RESULT 