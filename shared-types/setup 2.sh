#!/bin/bash

# Script de configuração para o pacote @cmex/shared-types
echo "Configurando o pacote @cmex/shared-types..."

# Instalando dependências
echo "Instalando as dependências..."
npm install

# Construindo o pacote
echo "Compilando o pacote..."
npm run build

# Executando os testes
echo "Executando os testes..."
npm test

# Criar link simbólico para uso local
echo "Criando link simbólico para desenvolvimento local..."
npm link

echo "Configuração concluída com sucesso!"
echo ""
echo "Para utilizar o pacote no frontend ou backend, execute:"
echo "  cd ../frontend && npm link @cmex/shared-types"
echo "  cd ../buscador_inteligente && npm link @cmex/shared-types"
echo ""
echo "Após o desenvolvimento, para publicar o pacote internamente:"
echo "  npm version [patch|minor|major]"
echo "  npm publish" 