#!/bin/bash
# Remover arquivo .env de todo o histórico do Git em todas as branches e tags
git filter-repo --force --invert-paths --path backend/.env

# Limpar referências antigas
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Reconfigurar remote
git remote set-url origin https://github.com/nextlw/cmex_poc.git

# Forçar push de todas as branches e tags
git push --force --all
git push --force --tags

# Verificar se .env foi removido
if git grep -q "OPENAI_API_KEY" ; then
    echo "Segredo ainda encontrado no histórico."
    exit 1
else
    echo "Segredo removido com sucesso."
fi