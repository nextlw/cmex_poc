#!/bin/bash

# Script para executar os testes automatizados do frontend

# Cores para saída
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando testes automatizados do frontend...${NC}"

# Criar diretório para relatórios de teste e evidências
mkdir -p test-reports/evidence
mkdir -p test-reports/screenshots
date_str=$(date +"%Y-%m-%d_%H-%M-%S")

# Log com timestamp para documentação
echo "Iniciando execução de testes: $(date)" > test-reports/evidence/test_execution_${date_str}.log

# Verificar se o Jest está instalado
if ! npm list --depth=0 | grep -q "jest"; then
  echo -e "${YELLOW}Instalando dependências de teste...${NC}"
  pnpm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom identity-obj-proxy ts-jest babel-jest jest-html-reporter
  echo "Dependências instaladas: $(date)" >> test-reports/evidence/test_execution_${date_str}.log
fi

# Registrar versões das ferramentas para documentação
echo "Versão do Node: $(node -v)" >> test-reports/evidence/test_execution_${date_str}.log
echo "Versão do NPM: $(npm -v)" >> test-reports/evidence/test_execution_${date_str}.log
echo "Versão do Jest: $(npx jest --version)" >> test-reports/evidence/test_execution_${date_str}.log

# Executar testes de componentes
echo -e "${YELLOW}Executando testes de componentes...${NC}"
echo "Executando testes de componentes: $(date)" >> test-reports/evidence/test_execution_${date_str}.log
npx jest --testPathPattern=src/__tests__/components --json --outputFile=test-reports/component-tests.json || component_tests_failed=true
echo "Resultado dos testes de componentes: $?" >> test-reports/evidence/test_execution_${date_str}.log

# Executar testes de integração
echo -e "${YELLOW}Executando testes de integração...${NC}"
echo "Executando testes de integração: $(date)" >> test-reports/evidence/test_execution_${date_str}.log
npx jest --testPathPattern=src/__tests__/integration --json --outputFile=test-reports/integration-tests.json || integration_tests_failed=true
echo "Resultado dos testes de integração: $?" >> test-reports/evidence/test_execution_${date_str}.log

# Executar testes end-to-end
echo -e "${YELLOW}Executando testes end-to-end...${NC}"
echo "Executando testes end-to-end: $(date)" >> test-reports/evidence/test_execution_${date_str}.log
npx jest --testPathPattern=src/__tests__/e2e --json --outputFile=test-reports/e2e-tests.json || e2e_tests_failed=true
echo "Resultado dos testes end-to-end: $?" >> test-reports/evidence/test_execution_${date_str}.log

# Gerar cobertura de código
echo -e "${YELLOW}Gerando relatório de cobertura...${NC}"
echo "Gerando relatório de cobertura: $(date)" >> test-reports/evidence/test_execution_${date_str}.log
npx jest --coverage --coverageReporters="json-summary" || coverage_failed=true
echo "Resultado da geração de cobertura: $?" >> test-reports/evidence/test_execution_${date_str}.log

# Atualizar documento de evidências
echo -e "${YELLOW}Atualizando documento de evidências...${NC}"
echo "Atualizando documento de evidências: $(date)" >> test-reports/evidence/test_execution_${date_str}.log
node src/__tests__/update_evidence.js
echo "Documento de evidências atualizado: $(date)" >> test-reports/evidence/test_execution_${date_str}.log

# Verificar resultados
if [ "$component_tests_failed" = true ] || [ "$integration_tests_failed" = true ] || [ "$e2e_tests_failed" = true ]; then
  echo -e "${RED}Alguns testes falharam. Verifique os relatórios em test-reports/ para mais detalhes.${NC}"
  echo "FALHA: Alguns testes falharam. Veja os detalhes no relatório HTML." >> test-reports/evidence/test_execution_${date_str}.log
  
  echo -e "${YELLOW}Evidências de testes disponíveis em:${NC}"
  echo -e "  - Relatório HTML: ${GREEN}test-reports/test-report.html${NC}"
  echo -e "  - Documento de evidências: ${GREEN}src/__tests__/TEST_EVIDENCE.md${NC}"
  echo -e "  - Logs de execução: ${GREEN}test-reports/evidence/test_execution_${date_str}.log${NC}"
  
  echo "Testes finalizados com falhas: $(date)" >> test-reports/evidence/test_execution_${date_str}.log
  
  exit 1
else
  echo -e "${GREEN}Todos os testes foram executados com sucesso!${NC}"
  echo "SUCESSO: Todos os testes foram executados com sucesso!" >> test-reports/evidence/test_execution_${date_str}.log
  
  echo -e "${YELLOW}Evidências de testes disponíveis em:${NC}"
  echo -e "  - Relatório HTML: ${GREEN}test-reports/test-report.html${NC}"
  echo -e "  - Documento de evidências: ${GREEN}src/__tests__/TEST_EVIDENCE.md${NC}"
  echo -e "  - Relatório de cobertura: ${GREEN}coverage/lcov-report/index.html${NC}"
  echo -e "  - Logs de execução: ${GREEN}test-reports/evidence/test_execution_${date_str}.log${NC}"
  
  echo "Relatório de cobertura gerado em coverage/lcov-report/index.html" >> test-reports/evidence/test_execution_${date_str}.log
  echo "Testes finalizados com sucesso: $(date)" >> test-reports/evidence/test_execution_${date_str}.log
  
  exit 0
fi 