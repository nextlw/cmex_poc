FROM node:20-alpine

WORKDIR /app

# Copiar apenas arquivos de package.json para instalar dependências
COPY package*.json ./
RUN npm install

# Copiar código fonte e configurações, excluindo node_modules (via .dockerignore)
COPY . .

# Construir o projeto
RUN npm run build

# Este é um container de build, não precisa expor portas
CMD ["echo", "Tipos compartilhados construídos com sucesso!"] 