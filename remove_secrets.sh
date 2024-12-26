
#!/bin/bash
# Remover arquivo .env do histórico
git filter-repo --invert-paths --path backend/.env

# Reconfigurar remote
git remote set-url origin https://github.com/nextlw/cmex_poc.git

# Atualizar branch
git add .gitignore backend/.env.example
git commit -m "chore: secure environment setup"

# Push forçado
git push --force origin development