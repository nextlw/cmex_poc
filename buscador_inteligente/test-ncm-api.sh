#!/bin/bash

# Cores para saída
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
PORT=${1:-3001}
API_BASE="http://localhost:${PORT}/api/v1"
MOCK_MODE=${2:-"true"}

# Verifica se o servidor está rodando
echo -e "${BLUE}Verificando se o servidor está rodando na porta ${PORT}...${NC}"
if ! curl -s "http://localhost:${PORT}" > /dev/null; then
    echo -e "${YELLOW}Servidor não encontrado na porta ${PORT}. Iniciando servidor...${NC}"
    
    # Inicia o servidor em background
    PORT=${PORT} NODE_ENV=development MOCK_RESPONSES=${MOCK_MODE} npm run server &
    SERVER_PID=$!
    
    # Aguarda o servidor iniciar
    echo -e "${BLUE}Aguardando servidor iniciar...${NC}"
    sleep 5
    
    # Verifica novamente
    if ! curl -s "http://localhost:${PORT}" > /dev/null; then
        echo -e "${RED}Falha ao iniciar o servidor. Verifique se a porta ${PORT} está disponível.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Servidor iniciado com sucesso na porta ${PORT}!${NC}"
else
    echo -e "${GREEN}Servidor já está rodando na porta ${PORT}.${NC}"
fi

# Função para executar testes
run_test() {
    local description=$1
    local endpoint=$2
    local payload=$3
    
    echo -e "\n${BLUE}Teste: ${description}${NC}"
    echo -e "${YELLOW}Endpoint: ${endpoint}${NC}"
    echo -e "${YELLOW}Payload: ${payload}${NC}"
    
    # Executa a requisição
    response=$(curl -s -X POST "${API_BASE}/${endpoint}" \
        -H "Content-Type: application/json" \
        -d "${payload}")
    
    # Verifica se a resposta é válida
    if [[ $(echo $response | jq -r 'if type=="object" then "valid" else "invalid" end') == "valid" ]]; then
        echo -e "${GREEN}✓ Resposta válida${NC}"
        
        # Verifica presença de campos específicos
        if [[ $endpoint == "ncm" ]]; then
            ncm=$(echo $response | jq -r '.ncm // "não encontrado"')
            echo -e "${BLUE}NCM: ${ncm}${NC}"
            
            if [[ $(echo $payload | jq -r '.useDeepResearch // false') == "true" ]]; then
                confianca=$(echo $response | jq -r '.validacao_profunda.confianca // "não encontrada"')
                modelo=$(echo $response | jq -r '.validacao_profunda.modelo_utilizado // "não encontrado"')
                echo -e "${BLUE}Confiança: ${confianca}${NC}"
                echo -e "${BLUE}Modelo: ${modelo}${NC}"
            fi
        fi
    else
        echo -e "${RED}✗ Resposta inválida${NC}"
        echo -e "${RED}${response}${NC}"
    fi
}

# Teste 1: Consulta NCM básica
run_test "Consulta NCM básica" "ncm" '{
    "consulta": "camisa polo masculina",
    "estadoOrigem": "SP",
    "operacao": "Venda",
    "regimeTributario": "Simples Nacional",
    "tributacao": "Normal",
    "modelo": "Qwen2.5-7b-instruct-1m"
}'

# Teste 2: Consulta NCM com DeepResearch
run_test "Consulta NCM com DeepResearch" "ncm" '{
    "consulta": "camisa polo masculina",
    "estadoOrigem": "SP",
    "operacao": "Venda",
    "regimeTributario": "Simples Nacional",
    "tributacao": "Normal",
    "modelo": "Qwen2.5-7b-instruct-1m",
    "useDeepResearch": true
}'

# Teste 3: Consulta NCM com parâmetros faltantes
run_test "Consulta NCM com parâmetros faltantes" "ncm" '{
    "consulta": "camisa polo masculina"
}'

# Teste 4: Consulta Trash Query
run_test "Consulta Trash Query" "trash-query" '{
    "query": "Teste de API",
    "context": "Apenas um teste"
}'

# Teste 5: Consulta NCM com outro modelo
run_test "Consulta NCM com modelo Claude" "ncm" '{
    "consulta": "smartphone apple iphone",
    "estadoOrigem": "SP",
    "modelo": "Nex-0.3-Preview-2024",
    "useDeepResearch": true
}'

echo -e "\n${GREEN}Todos os testes concluídos!${NC}"

# Se o servidor foi iniciado pelo script, oferece opção para parar
if [[ -n "$SERVER_PID" ]]; then
    read -p "Deseja parar o servidor? (s/n): " stop_server
    if [[ "$stop_server" == "s" ]]; then
        kill $SERVER_PID
        echo -e "${GREEN}Servidor finalizado.${NC}"
    else
        echo -e "${YELLOW}Servidor continua rodando com PID ${SERVER_PID}.${NC}"
        echo -e "${YELLOW}Para pará-lo manualmente, execute: kill ${SERVER_PID}${NC}"
    fi
fi

exit 0 