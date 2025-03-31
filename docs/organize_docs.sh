#!/bin/bash

# Script para organizar a documentação em pastas estruturadas

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Iniciando organização da documentação do projeto CMEX...${NC}"

# Criar estrutura de diretórios
mkdir -p docs/arquitetura
mkdir -p docs/guias
mkdir -p docs/tecnico
mkdir -p docs/referencias
mkdir -p docs/analises
mkdir -p docs/implementacao
mkdir -p docs/scripts
mkdir -p docs/json

# Mover arquivos para as pastas apropriadas
echo -e "${YELLOW}Organizando documentos de arquitetura...${NC}"
mv docs/estructura_projeto_integracao.md docs/arquitetura/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/comunicacao_microservicos.md docs/arquitetura/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/plano_integracao_ferramentas.md docs/arquitetura/ 2>/dev/null || echo "Arquivo já movido ou não existe"

echo -e "${YELLOW}Organizando guias...${NC}"
mv docs/ambiente.md docs/guias/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/guia-usuario.md docs/guias/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/swagger.md docs/guias/ 2>/dev/null || echo "Arquivo já movido ou não existe"

echo -e "${YELLOW}Organizando documentação técnica...${NC}"
mv docs/implementacao_redis.md docs/tecnico/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/testes.md docs/tecnico/ 2>/dev/null || echo "Arquivo já movido ou não existe"

echo -e "${YELLOW}Organizando análises...${NC}"
mv docs/analise_comparativa.md docs/analises/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/analise_comparativa_agents.md docs/analises/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/analise_comparativa.pdf docs/analises/ 2>/dev/null || echo "Arquivo já movido ou não existe"

echo -e "${YELLOW}Organizando documentos de implementação...${NC}"
mv docs/IMPLEMENTATION_STEPS.md docs/implementacao/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/IMPLEMENTATION_SUMMARY.md docs/implementacao/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/IMPLEMENTATION_PLAN.md docs/implementacao/ 2>/dev/null || echo "Arquivo já movido ou não existe"

echo -e "${YELLOW}Organizando extratores...${NC}"
mv docs/README-extractor.md docs/extratores/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/README-deepsearch-extrator.md docs/extratores/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/README-extrator.md docs/extratores/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/fastapi_extractor.py docs/extratores/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/frontend_extractor.js docs/extratores/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/node_deepresearch_extractor.js docs/extratores/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/buscador_reference_extractor.js docs/extratores/ 2>/dev/null || echo "Arquivo já movido ou não existe"
mv docs/deepsearch_reference_extractor.js docs/extratores/ 2>/dev/null || echo "Arquivo já movido ou não existe"

echo -e "${YELLOW}Organizando arquivos JSON...${NC}"
mv docs/*_reference.json docs/json/ 2>/dev/null || echo "Arquivos JSON já movidos ou não existem"

# Copiar o sumário para a raiz
cp docs/llm_project_summary.md docs/README.md 2>/dev/null || echo "Sumário já copiado ou não existe"

# Criar índice em cada pasta
echo -e "${YELLOW}Criando índices em cada pasta...${NC}"

# Arquitetura
cat > docs/arquitetura/README.md << EOL
# Documentação de Arquitetura

Este diretório contém documentos relacionados à arquitetura do projeto CMEX:

$(ls -1 docs/arquitetura/ | grep -v "README.md" | while read file; do
  echo "- [$file](./$file) - $(head -n 1 "docs/arquitetura/$file" | sed 's/^#* //')"
done)

[Voltar ao Índice Principal](../README.md)
EOL

# Guias
cat > docs/guias/README.md << EOL
# Guias

Este diretório contém guias e manuais do projeto CMEX:

$(ls -1 docs/guias/ | grep -v "README.md" | while read file; do
  echo "- [$file](./$file) - $(head -n 1 "docs/guias/$file" | sed 's/^#* //')"
done)

[Voltar ao Índice Principal](../README.md)
EOL

# Técnico
cat > docs/tecnico/README.md << EOL
# Documentação Técnica

Este diretório contém documentação técnica detalhada do projeto CMEX:

$(ls -1 docs/tecnico/ | grep -v "README.md" | while read file; do
  echo "- [$file](./$file) - $(head -n 1 "docs/tecnico/$file" | sed 's/^#* //')"
done)

[Voltar ao Índice Principal](../README.md)
EOL

# Análises
cat > docs/analises/README.md << EOL
# Análises

Este diretório contém análises comparativas do projeto CMEX:

$(ls -1 docs/analises/ | grep -v "README.md" | while read file; do
  if [[ $file == *.pdf ]]; then
    echo "- [$file](./$file) - Versão PDF da análise comparativa"
  else
    echo "- [$file](./$file) - $(head -n 1 "docs/analises/$file" | sed 's/^#* //')"
  fi
done)

[Voltar ao Índice Principal](../README.md)
EOL

# Implementação
cat > docs/implementacao/README.md << EOL
# Documentação de Implementação

Este diretório contém documentos sobre o progresso e planos de implementação do projeto CMEX:

$(ls -1 docs/implementacao/ | grep -v "README.md" | while read file; do
  echo "- [$file](./$file) - $(head -n 1 "docs/implementacao/$file" | sed 's/^#* //')"
done)

[Voltar ao Índice Principal](../README.md)
EOL

# Extratores
cat > docs/extratores/README.md << EOL
# Extratores de Documentação

Este diretório contém os scripts extratores que geram a documentação JSON de referência:

$(ls -1 docs/extratores/ | grep -v "README.md" | while read file; do
  if [[ $file == *.py || $file == *.js ]]; then
    echo "- [$file](./$file) - Script extrator"
  else
    echo "- [$file](./$file) - Documentação do extrator"
  fi
done)

[Voltar ao Índice Principal](../README.md)
EOL

# JSON
cat > docs/json/README.md << EOL
# Arquivos JSON de Referência

Este diretório contém os arquivos JSON gerados pelos extratores de documentação:

$(ls -1 docs/json/ | grep -v "README.md" | while read file; do
  filesize=$(du -h "docs/json/$file" | cut -f1)
  echo "- [$file](./$file) - $filesize"
done)

**Nota:** Estes arquivos são gerados automaticamente pelos extratores e não devem ser editados manualmente.

[Voltar ao Índice Principal](../README.md)
EOL

echo -e "${GREEN}Organização concluída! A documentação agora está estruturada nas seguintes pastas:${NC}"
echo -e "  ${BLUE}docs/arquitetura/${NC} - Documentos de arquitetura"
echo -e "  ${BLUE}docs/guias/${NC} - Guias e manuais"
echo -e "  ${BLUE}docs/tecnico/${NC} - Documentação técnica"
echo -e "  ${BLUE}docs/analises/${NC} - Análises comparativas"
echo -e "  ${BLUE}docs/implementacao/${NC} - Progresso e planos de implementação"
echo -e "  ${BLUE}docs/extratores/${NC} - Scripts extratores"
echo -e "  ${BLUE}docs/json/${NC} - Arquivos JSON gerados"
echo -e "${GREEN}Um índice foi criado em cada pasta e o sumário principal está em docs/README.md${NC}" 